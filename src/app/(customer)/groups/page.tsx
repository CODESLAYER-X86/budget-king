import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMyGroups } from "@/actions/groups";
import { GroupsListClient } from "./groups-list-client";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/groups");

  const groups = await getMyGroups();

  return (
    <div className="container mx-auto px-4 py-8">
      <GroupsListClient groups={groups} />
    </div>
  );
}
