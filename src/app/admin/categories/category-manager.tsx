"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveCategoryAction, deleteCategoryAction, toggleCategoryStatusAction } from "@/actions/categories";
import type { Category } from "@prisma/client";

type CategoryRow = Category & {
  parent: { name: string } | null;
  _count: { products: number };
};

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  function generateSlug() {
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveCategoryAction({
        name,
        slug: slug || undefined,
        parentId: parentId || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Category created" });
      setName(""); setSlug(""); setDescription(""); setImageUrl(""); setParentId("");
      router.refresh();
    });
  }

  function handleToggleStatus(id: string) {
    startTransition(async () => {
      const result = await toggleCategoryStatusAction(id);
      if (!result.ok) {
        toast({ title: "Failed to update status", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Category status updated" });
      router.refresh();
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Permanently delete category "${name}"? Products in this category will be safely reassigned.`)) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.ok) {
        toast({ title: "Failed to delete", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Category permanently deleted" });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No categories yet.</p>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/30 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {c.parent && <span className="text-xs text-muted-foreground">↳</span>}
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    /{c.slug} • {c._count.products} products
                  </p>
                  {c.parent && (
                    <p className="text-xs text-muted-foreground">under {c.parent.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(c.id)}
                    disabled={pending}
                    className="focus:outline-hidden"
                    title="Click to toggle Active / Hidden status"
                  >
                    <Badge
                      variant={c.isActive ? "default" : "secondary"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {c.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={pending}
                    title="Permanently Delete Category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="cname">Name *</Label>
              <Input
                id="cname"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={generateSlug}
                placeholder="e.g. Casual Shirts"
              />
            </div>
            <div>
              <Label htmlFor="cslug">Slug *</Label>
              <Input
                id="cslug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="casual-shirts"
              />
            </div>
            <div>
              <Label htmlFor="cparent">Parent Category</Label>
              <select
                id="cparent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Top-level —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="cdesc">Description</Label>
              <Textarea
                id="cdesc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="cimg">Image URL</Label>
              <Input
                id="cimg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
