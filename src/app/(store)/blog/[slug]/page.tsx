import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Share2 } from "lucide-react";
import type { Metadata } from "next";
import { BlogContent } from "./blog-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, metaDescription: true, coverImage: true },
  });
  if (!post) return { title: "Post not found — Budget King BD" };
  const description = post.metaDescription ?? post.excerpt ?? "Read on Budget King BD Blog";
  return {
    title: `${post.title} — Budget King BD`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { fullName: true, email: true } },
      category: { select: { name: true, slug: true } },
    },
  });
  if (!post) notFound();

  // Increment view count (fire-and-forget)
  db.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // Related posts
  const related = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: post.categoryId,
      id: { not: post.id },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Blog
      </Link>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        {post.category && (
          <Badge variant="outline">
            <Link href={`/blog?category=${post.category.slug}`}>{post.category.name}</Link>
          </Badge>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-BD", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {post.author.fullName ?? post.author.email.split("@")[0]}
        </span>
        <span>• {post.viewCount + 1} views</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{post.title}</h1>
      {post.excerpt && (
        <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>
      )}

      {post.coverImage && (
        <div className="aspect-[16/9] overflow-hidden rounded-lg mb-6 bg-muted">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <BlogContent content={post.content} />

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">#{tag}</Badge>
          ))}
        </div>
      )}

      {/* Share */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Share2 className="h-4 w-4" /> Share:
        </span>
        <ShareLinks title={post.title} slug={post.slug} />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4">Related Posts</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.publishedAt ?? r.createdAt).toLocaleDateString("en-BD", {
                        day: "numeric", month: "short",
                      })}
                    </p>
                    <h3 className="font-medium text-sm mt-1 line-clamp-2 hover:text-primary">
                      {r.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function ShareLinks({ title, slug }: { title: string; slug: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/blog/${slug}`;
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return (
    <>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
      >
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
      >
        Twitter / X
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
      >
        WhatsApp
      </a>
    </>
  );
}
