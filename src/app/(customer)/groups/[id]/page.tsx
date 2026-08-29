import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getGroupDetail } from "@/actions/groups";
import { db } from "@/lib/db";
import { GroupDetailClient } from "./group-detail-client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/groups");

  const { id } = await params;
  const group = await getGroupDetail(id);
  if (!group) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Group not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You may not be a member of this group.
        </p>
        <Link href="/groups" className="mt-4 inline-block text-primary hover:underline">
          ← Back to My Groups
        </Link>
      </div>
    );
  }

  // Fetch delivery zones for the checkout form
  const deliveryZones = await db.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { charge: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Back to My Groups
      </Link>
      <GroupDetailClient
        group={group}
        deliveryZones={deliveryZones.map((z) => ({
          id: z.id,
          name: z.name,
          charge: Number(z.charge),
          estimatedDays: z.estimatedDays,
        }))}
      />
    </div>
  );
}
