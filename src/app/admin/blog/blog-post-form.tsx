"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveBlogPostAction } from "@/actions/blog";
import type { BlogPost, BlogCategory } from "@prisma/client";

type FullPost = (BlogPost & { tags: string[] }) | null;

export function BlogPostForm({
  categories,
  post,
}: {
  categories: BlogCategory[];
  post?: FullPost;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [status, setStatus] = useState<string>(post?.status ?? "DRAFT");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");

  function generateSlug() {
    setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveBlogPostAction({
        id: post?.id,
        title,
        slug,
        excerpt: excerpt || undefined,
        content,
        coverImage: coverImage || undefined,
        categoryId: categoryId || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: status as any,
        metaDescription: metaDescription || undefined,
      });
      if (!result.ok) {
        toast({ title: "Save failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Post saved" });
      router.push("/admin/blog");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {/* Main column */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={generateSlug}
                placeholder="How to Style Oxford Shirts"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="how-to-style-oxford-shirts"
              />
            </div>
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short summary that appears on the blog list page"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="content">Content (Markdown) *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showPreview ? "Edit" : "Preview"}
                </Button>
              </div>
              {showPreview ? (
                <div className="prose prose-sm max-w-none min-h-[400px] border rounded-md p-4 bg-secondary/30">
                  <MarkdownPreview content={content} />
                </div>
              ) : (
                <Textarea
                  id="content"
                  required
                  rows={20}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"# Heading\n\nWrite your post in **markdown**.\n\n- List item\n- List item"}
                  className="font-mono text-sm"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              {post ? "Update Post" : "Save Post"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Uncategorized" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="shirts, fashion, guide"
              />
            </div>
            <div>
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input
                id="cover"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="meta">Meta Description (for SEO)</Label>
              <Textarea
                id="meta"
                rows={2}
                maxLength={160}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="160 chars max"
              />
              <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return <ReactMarkdown>{content}</ReactMarkdown>;
}
