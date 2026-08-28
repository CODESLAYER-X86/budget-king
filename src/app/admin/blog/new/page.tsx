import { db } from "@/lib/db";
import { BlogPostForm } from "../blog-post-form";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  const categories = await db.blogCategory.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Blog Post</h1>
        <p className="text-sm text-muted-foreground">Write a new blog post in markdown</p>
      </div>
      <BlogPostForm categories={categories} />
    </div>
  );
}
