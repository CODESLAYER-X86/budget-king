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
import { ReviewActions } from "@/app/moderator/reviews/review-actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await db.review.findMany({
    where: { status: { in: ["PENDING", "REJECTED"] } },
    include: {
      user: { select: { fullName: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject customer reviews. {reviews.length} pending.
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No reviews awaiting moderation.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead className="hidden md:table-cell">Rating</TableHead>
                  <TableHead className="hidden md:table-cell">Comment</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.product.name}</TableCell>
                    <TableCell className="text-sm">{r.user.fullName ?? r.user.email}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs">
                      {r.title && <p className="font-medium">{r.title}</p>}
                      {r.content && <p className="line-clamp-2">{r.content}</p>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={r.status === "PENDING" ? "secondary" : "destructive"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ReviewActions reviewId={r.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
