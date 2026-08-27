import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/management/admin-sidebar";
import { AdminTopbar } from "@/components/management/admin-topbar";

export const dynamic = "force-dynamic";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("AGENT", "ADMIN");
  return (
    <div className="flex min-h-screen bg-secondary/30">
      <AdminSidebar role={session.profile!.role} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <AdminTopbar user={session} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
