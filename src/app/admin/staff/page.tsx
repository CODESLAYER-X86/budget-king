import { db } from "@/lib/db";
import { StaffManager } from "./staff-manager";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const { q, role } = await searchParams;

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  if (role && role !== "ALL") {
    where.role = role;
  }

  const users = await db.profile.findMany({
    where,
    orderBy: [{ isStaff: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  const counts = await db.profile.groupBy({
    by: ["role"],
    _count: { _all: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff &amp; Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage user roles and access. Promote customers to Agent, Moderator, or Admin.
        </p>
      </div>
      <StaffManager
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role,
          isStaff: u.isStaff,
          isSuspended: u.isSuspended,
          orderCount: u._count.orders,
          createdAt: u.createdAt.toISOString(),
        }))}
        roleCounts={counts.map((c) => ({ role: c.role, count: c._count._all }))}
        currentQuery={q ?? ""}
        currentRoleFilter={role ?? "ALL"}
      />
    </div>
  );
}
