import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BlogPostForm } from "../blog-post-form";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    db.blogPost.findUnique({ where: { id } }),
    db.blogCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Post</h1>
        <p className="text-sm text-muted-foreground">{post.title}</p>
      </div>
      <BlogPostForm categories={categories} post={post} />
    </div>
  );
}
