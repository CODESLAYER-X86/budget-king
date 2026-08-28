import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ModeratorGroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Group Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review and moderate group activity (Phase 6).
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">
            Group shopping will be available after Phase 6 is implemented.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This page will show reported group content, member management, and group suspensions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
