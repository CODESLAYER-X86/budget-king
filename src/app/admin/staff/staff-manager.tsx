"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Loader2, ShieldBan, ShieldCheck, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateUserRoleAction, toggleUserSuspensionAction } from "@/actions/staff";

type User = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  isStaff: boolean;
  isSuspended: boolean;
  orderCount: number;
  createdAt: string;
};

type RoleCount = { role: string; count: number };

const ROLE_BADGES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ADMIN: "default",
  MODERATOR: "secondary",
  AGENT: "outline",
  CUSTOMER: "outline",
};

export function StaffManager({
  users,
  roleCounts,
  currentQuery,
  currentRoleFilter,
}: {
  users: User[];
  roleCounts: RoleCount[];
  currentQuery: string;
  currentRoleFilter: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentQuery);
  const [roleFilter, setRoleFilter] = useState(currentRoleFilter);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (roleFilter && roleFilter !== "ALL") params.set("role", roleFilter);
    router.push(`/admin/staff?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId);
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role: newRole as any });
      setUpdatingId(null);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Role updated" });
      router.refresh();
    });
  }

  function handleSuspend(userId: string, isSuspended: boolean) {
    startTransition(async () => {
      const result = await toggleUserSuspensionAction({ userId });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: isSuspended ? "User unsuspended" : "User suspended" });
      router.refresh();
    });
  }

  const totalUsers = roleCounts.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        {roleCounts.map((rc) => (
          <Card key={rc.role}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{rc.count}</p>
              <p className="text-xs text-muted-foreground">{rc.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, name, or phone..."
              className="pl-9"
            />
          </div>
        </form>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setTimeout(applyFilters, 100);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MODERATOR">Moderator</SelectItem>
            <SelectItem value="AGENT">Agent</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="text-center hidden md:table-cell">Orders</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-10 w-10 mb-2 text-muted-foreground/50" />
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className={u.isSuspended ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{u.fullName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {u.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell text-sm">
                      {u.orderCount}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u.id, v)}
                        disabled={pending && updatingId === u.id}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue>
                            <Badge variant={ROLE_BADGES[u.role] ?? "outline"} className="text-xs">
                              {u.role}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">Customer</SelectItem>
                          <SelectItem value="AGENT">Agent</SelectItem>
                          <SelectItem value="MODERATOR">Moderator</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {pending && updatingId === u.id && (
                        <Loader2 className="inline-block ml-1 h-3 w-3 animate-spin" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.isSuspended ? (
                        <Badge variant="destructive" className="text-xs">Suspended</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => handleSuspend(u.id, u.isSuspended)}
                        className={u.isSuspended ? "text-green-600" : "text-destructive"}
                      >
                        {u.isSuspended ? (
                          <><ShieldCheck className="h-3.5 w-3.5 mr-1" /> Unsuspend</>
                        ) : (
                          <><ShieldBan className="h-3.5 w-3.5 mr-1" /> Suspend</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        💡 Tip: When you change someone&apos;s role, they get an in-app notification. They need to
        sign out and back in for the change to take effect on their session.
      </p>
    </div>
  );
}
