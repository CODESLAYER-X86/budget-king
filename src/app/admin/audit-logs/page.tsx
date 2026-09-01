import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/date";
import Link from "next/link";
import { ArrowRight, UserCheck, ShoppingBag, Shield, Coins, Package, FolderTree, Truck, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

type AuditDetails = {
  from?: string;
  to?: string;
  reason?: string | null;
  amount?: number;
  total?: number;
  itemCount?: number;
  name?: string;
  userEmail?: string;
  assignedAgentName?: string;
  previousAgentId?: string | null;
  [key: string]: unknown;
};

export default async function AdminAuditLogsPage() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Extract unique user IDs for batch lookup
  const userIds = new Set<string>();
  const orderNumbers = new Set<string>();

  for (const log of logs) {
    if (log.actorId && log.actorId !== "system") {
      userIds.add(log.actorId);
    }
    if (log.target?.startsWith("user:")) {
      const targetUserId = log.target.replace("user:", "");
      if (targetUserId) userIds.add(targetUserId);
    }
    if (log.target?.startsWith("order:")) {
      const orderNum = log.target.replace("order:", "");
      if (orderNum) orderNumbers.add(orderNum);
    }
  }

  // Batch query profiles
  const profiles = userIds.size > 0
    ? await db.profile.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: { id: true, fullName: true, email: true, role: true },
      })
    : [];

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // Batch query orders to resolve order URLs
  const orders = orderNumbers.size > 0
    ? await db.order.findMany({
        where: { orderNumber: { in: Array.from(orderNumbers) } },
        select: { id: true, orderNumber: true },
      })
    : [];

  const orderMap = new Map(orders.map((o) => [o.orderNumber, o.id]));

  function getActorBadgeVariant(role?: string | null) {
    switch (role) {
      case "ADMIN":
        return "default";
      case "AGENT":
        return "secondary";
      case "MODERATOR":
        return "outline";
      case "SYSTEM":
        return "outline";
      default:
        return "outline";
    }
  }

  function getStatusBadgeVariant(status?: string) {
    switch (status) {
      case "DELIVERED":
        return "default";
      case "CONFIRMED":
      case "PROCESSING":
      case "SHIPPED":
        return "secondary";
      case "CANCELLED":
      case "DELIVERY_FAILED":
        return "destructive";
      default:
        return "outline";
    }
  }

  function renderActionDetails(log: typeof logs[0], details: AuditDetails) {
    switch (log.action) {
      case "order.status_change":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-xs text-foreground">Status Change:</span>
              {details.from && (
                <Badge variant={getStatusBadgeVariant(details.from)} className="text-[11px] px-1.5 py-0">
                  {details.from.replace(/_/g, " ")}
                </Badge>
              )}
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              {details.to && (
                <Badge variant={getStatusBadgeVariant(details.to)} className="text-[11px] px-1.5 py-0">
                  {details.to.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
            {details.reason && (
              <p className="text-xs text-muted-foreground italic">
                Note: {details.reason}
              </p>
            )}
          </div>
        );

      case "order.assign_agent":
        return (
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">
              Assigned Agent: <span className="text-primary font-semibold">{details.assignedAgentName ?? "Staff"}</span>
            </p>
          </div>
        );

      case "staff.role_change": {
        const targetUserId = log.target?.replace("user:", "");
        const targetProfile = targetUserId ? profileMap.get(targetUserId) : null;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-xs text-foreground">Role Change:</span>
              {details.from && (
                <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                  {details.from}
                </Badge>
              )}
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              {details.to && (
                <Badge variant="default" className="text-[11px] px-1.5 py-0">
                  {details.to}
                </Badge>
              )}
            </div>
            {targetProfile && (
              <p className="text-xs text-muted-foreground">
                Target: {targetProfile.fullName ?? targetProfile.email}
              </p>
            )}
          </div>
        );
      }

      case "order.create":
        return (
          <p className="text-xs text-muted-foreground">
            New order placed {details.total !== undefined ? `• ৳${details.total}` : ""} {details.itemCount ? `(${details.itemCount} items)` : ""}
          </p>
        );

      case "coin.award":
        return (
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Awarded +{details.amount ?? "—"} Coins
          </p>
        );

      case "coin.reverse":
        return (
          <p className="text-xs font-medium text-destructive">
            Reversed Coins
          </p>
        );

      case "product.update":
      case "product.create":
        return (
          <p className="text-xs text-muted-foreground">
            {log.action === "product.create" ? "Created product" : "Updated product"}: <span className="font-medium text-foreground">{details.name ?? "—"}</span>
          </p>
        );

      default:
        return (
          <p className="text-xs text-muted-foreground font-mono">
            {log.action}
          </p>
        );
    }
  }

  function renderActionBadge(action: string) {
    if (action.startsWith("order.status_change")) {
      return (
        <Badge variant="secondary" className="gap-1 text-xs font-medium">
          <ShoppingBag className="h-3 w-3" /> Status Change
        </Badge>
      );
    }
    if (action.startsWith("order.assign_agent")) {
      return (
        <Badge variant="secondary" className="gap-1 text-xs font-medium">
          <UserCheck className="h-3 w-3" /> Agent Assigned
        </Badge>
      );
    }
    if (action.startsWith("staff.")) {
      return (
        <Badge variant="default" className="gap-1 text-xs font-medium">
          <Shield className="h-3 w-3" /> Staff Role
        </Badge>
      );
    }
    if (action.startsWith("coin.")) {
      return (
        <Badge variant="outline" className="gap-1 text-xs font-medium border-amber-400 text-amber-600">
          <Coins className="h-3 w-3" /> Rewards
        </Badge>
      );
    }
    if (action.startsWith("product.")) {
      return (
        <Badge variant="outline" className="gap-1 text-xs font-medium">
          <Package className="h-3 w-3" /> Product
        </Badge>
      );
    }
    if (action.startsWith("category.")) {
      return (
        <Badge variant="outline" className="gap-1 text-xs font-medium">
          <FolderTree className="h-3 w-3" /> Category
        </Badge>
      );
    }
    if (action.startsWith("delivery_zone.")) {
      return (
        <Badge variant="outline" className="gap-1 text-xs font-medium">
          <Truck className="h-3 w-3" /> Delivery
        </Badge>
      );
    }
    if (action.startsWith("review.")) {
      return (
        <Badge variant="outline" className="gap-1 text-xs font-medium">
          <MessageSquare className="h-3 w-3" /> Review
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs font-mono">
        {action}
      </Badge>
    );
  }

  function renderTarget(target?: string | null) {
    if (!target) return <span className="text-muted-foreground">—</span>;

    if (target.startsWith("order:")) {
      const orderNum = target.replace("order:", "");
      const orderId = orderMap.get(orderNum);
      if (orderId) {
        return (
          <Link
            href={`/admin/orders/${orderId}`}
            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            #{orderNum}
          </Link>
        );
      }
      return <span className="font-medium">#{orderNum}</span>;
    }

    if (target.startsWith("user:")) {
      const targetUserId = target.replace("user:", "");
      const targetProfile = profileMap.get(targetUserId);
      if (targetProfile) {
        return (
          <div>
            <p className="font-medium text-xs">{targetProfile.fullName ?? "User"}</p>
            <p className="text-[11px] text-muted-foreground">{targetProfile.email}</p>
          </div>
        );
      }
      return <span className="text-xs font-mono text-muted-foreground">{targetUserId.slice(0, 8)}...</span>;
    }

    if (target.startsWith("product:")) {
      const prodId = target.replace("product:", "");
      return <span className="text-xs text-muted-foreground">Product #{prodId.slice(0, 10)}</span>;
    }

    return <span className="text-xs text-muted-foreground">{target}</span>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Showing {logs.length} most recent administrative and staff actions.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Time</TableHead>
                <TableHead className="w-64">Actor (Who)</TableHead>
                <TableHead className="w-40">Action Type</TableHead>
                <TableHead className="min-w-[220px]">Details &amp; Status Transition</TableHead>
                <TableHead className="w-44">Target Resource</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No actions logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const actor = log.actorId ? profileMap.get(log.actorId) : null;
                  const isSystem = !log.actorId || log.actorId === "system" || log.actorRole === "SYSTEM";
                  const details = (log.details as AuditDetails) ?? {};

                  return (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      {/* Time */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-top py-3">
                        {formatDateTime(log.createdAt, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>

                      {/* Actor (Who) */}
                      <TableCell className="align-top py-3">
                        {isSystem ? (
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm">System Automated</p>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              SYSTEM
                            </Badge>
                          </div>
                        ) : actor ? (
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm text-foreground">
                              {actor.fullName ?? "User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {actor.email}
                            </p>
                            <Badge
                              variant={getActorBadgeVariant(log.actorRole ?? actor.role)}
                              className="text-[10px] uppercase px-1.5 py-0 mt-0.5"
                            >
                              {log.actorRole ?? actor.role}
                            </Badge>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm">
                              {log.actorRole === "CUSTOMER" ? "Customer" : log.actorRole ?? "Staff"}
                            </p>
                            {log.actorId && (
                              <p className="text-[11px] font-mono text-muted-foreground">
                                {log.actorId.slice(0, 12)}...
                              </p>
                            )}
                            {log.actorRole && (
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {log.actorRole}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Action Type Badge */}
                      <TableCell className="align-top py-3">
                        {renderActionBadge(log.action)}
                      </TableCell>

                      {/* Details & Status Transition */}
                      <TableCell className="align-top py-3">
                        {renderActionDetails(log, details)}
                      </TableCell>

                      {/* Target Resource */}
                      <TableCell className="align-top py-3 text-sm">
                        {renderTarget(log.target)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
