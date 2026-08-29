import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Shield, MessageSquare, Users, Flag, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ModeratorDashboardPage() {
  const [pendingReviews, reportedReviews, totalProducts, totalGroups] = await Promise.all([
    db.review.count({ where: { status: "PENDING" } }),
    db.review.count({ where: { status: "REJECTED" } }),
    db.product.count({ where: { status: "DRAFT" } }),
    db.auditLog.count({ where: { action: { startsWith: "group." } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moderator Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Review community content, reviews, and reported items.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pendingReviews}</p>
                <p className="text-xs text-muted-foreground">Reviews Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flag className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{reportedReviews}</p>
                <p className="text-xs text-muted-foreground">Reported Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <p className="text-xs text-muted-foreground">Draft Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalGroups}</p>
                <p className="text-xs text-muted-foreground">Group Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/moderator/reviews"
            className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
          >
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              Review Pending Reviews
            </div>
            <Badge variant="secondary">{pendingReviews}</Badge>
          </Link>
          <Link
            href="/moderator/groups"
            className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
          >
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-purple-500" />
              Manage Groups
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>• Group content moderation (Phase 6)</p>
          <p>• Customer report handling (Phase 3)</p>
          <p>• Review image moderation (Phase 4)</p>
          <p>• User suspension tools (Phase 3)</p>
        </CardContent>
      </Card>
    </div>
  );
}
