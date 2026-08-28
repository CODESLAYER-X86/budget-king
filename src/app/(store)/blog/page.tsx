import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";

export const revalidate = 300;

export const metadata = {
  title: "Blog — Budget King BD",
  description: "Buying guides, fashion tips, and Budget King BD updates",
};

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { fullName: true, email: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Budget King Blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buying guides, fashion tips, and store updates
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_240px]">
        {/* Posts */}
        <div>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No blog posts yet. Check back soon!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="grid sm:grid-cols-[200px_1fr] gap-0">
                        {post.coverImage && (
                          <div className="aspect-video sm:aspect-square overflow-hidden bg-muted">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            {post.category && (
                              <Badge variant="outline">{post.category.name}</Badge>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-BD", {
                                day: "numeric", month: "long", year: "numeric",
                              })}
                            </span>
                          </div>
                          <h2 className="font-bold text-lg hover:text-primary">{post.title}</h2>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {post.author.fullName ?? post.author.email.split("@")[0]}
                            <ArrowRight className="ml-auto h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Categories</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary">
                    All ({posts.length})
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/blog?category=${c.slug}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {c.name} ({c._count.posts})
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
