"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Loader2, Copy, Check, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createGroupAction, joinGroupAction, leaveGroupAction } from "@/actions/groups";

type Group = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  status: string;
  role: string;
  ownerName: string;
  ownerId: string;
  memberCount: number;
  productCount: number;
  cartItemCount: number;
  joinedAt: string;
  createdAt: string;
};

export function GroupsListClient({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    maxMembers: "10",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createGroupAction({
        name: form.name,
        description: form.description || undefined,
        maxMembers: parseInt(form.maxMembers, 10),
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Group created!", description: `Code: ${result.code}` });
      setForm({ name: "", description: "", maxMembers: "10" });
      setShowCreate(false);
      router.refresh();
    });
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    startTransition(async () => {
      const result = await joinGroupAction(joinCode);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Joined group!" });
      setJoinCode("");
      router.refresh();
    });
  }

  async function handleLeave(groupId: string, name: string) {
    if (!confirm(`Leave "${name}"?`)) return;
    startTransition(async () => {
      const result = await leaveGroupAction(groupId);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Left group" });
      router.refresh();
    });
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Groups</h1>
          <p className="text-sm text-muted-foreground">
            Shop together with friends — vote on products and combine orders.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> Create Group
        </Button>
      </div>

      {/* Join via code */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-xs text-muted-foreground">Have an invite code?</Label>
          <div className="mt-1 flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="BK-XXXXX"
              className="font-mono uppercase"
            />
            <Button onClick={handleJoin} disabled={pending || !joinCode.trim()}>
              Join
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label htmlFor="gname">Group Name *</Label>
                <Input
                  id="gname"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. DIU CSE Friends"
                />
              </div>
              <div>
                <Label htmlFor="gdesc">Description (optional)</Label>
                <Textarea
                  id="gdesc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Buying shirts together"
                />
              </div>
              <div>
                <Label htmlFor="gmax">Max Members</Label>
                <Input
                  id="gmax"
                  type="number"
                  min={2}
                  max={50}
                  value={form.maxMembers}
                  onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Create
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List of groups */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-2 text-muted-foreground/50" />
            You haven&apos;t joined any groups yet. Create one or join with an invite code.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/groups/${g.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {g.name}
                      </Link>
                      {g.role === "OWNER" && <Badge className="text-xs">Owner</Badge>}
                      {g.status !== "ACTIVE" && (
                        <Badge variant="secondary">{g.status}</Badge>
                      )}
                    </div>
                    {g.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {g.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>👥 {g.memberCount} members</span>
                      <span>👕 {g.productCount} products</span>
                      {g.cartItemCount > 0 && <span>🛒 {g.cartItemCount} in cart</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => copyCode(g.code)}
                        className="font-mono text-xs bg-secondary px-2 py-1 rounded hover:bg-accent flex items-center gap-1"
                      >
                        {g.code}
                        {copiedCode === g.code ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        Owner: {g.ownerName}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href={`/groups/${g.id}`}>
                      <Button size="sm" variant="outline">Open</Button>
                    </Link>
                    {g.role !== "OWNER" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleLeave(g.id, g.name)}
                        disabled={pending}
                      >
                        <LogOut className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
