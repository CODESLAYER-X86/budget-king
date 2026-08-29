import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await db.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { email: true, fullName: true } },
      category: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-sm text-muted-foreground">{posts.length} posts total</p>
        </div>
        <Link href="/admin/blog/new">
          <Button><Plus className="mr-1 h-4 w-4" /> New Post</Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Author</TableHead>
              <TableHead className="text-center">Views</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="hidden sm:table-cell">Updated</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No blog posts yet. Click &quot;New Post&quot; to write your first one.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.title}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {p.author.fullName ?? p.author.email}
                  </TableCell>
                  <TableCell className="text-center text-sm">{p.viewCount}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        p.status === "PUBLISHED" ? "default" :
                        p.status === "ARCHIVED" ? "secondary" :
                        "outline"
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString("en-BD")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.status === "PUBLISHED" && (
                        <Link href={`/blog/${p.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="View">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/admin/blog/${p.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
