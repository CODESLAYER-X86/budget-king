"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveProductAction, deleteProductAction } from "@/actions/products";
import type { Category, Product, ProductVariant, ProductImage, ProductAttributeValue } from "@prisma/client";

type FullProduct = (Product & {
  variants: (ProductVariant & { inventory: { quantity: number; reserved: number } | null })[];
  images: ProductImage[];
  attributeValues: (ProductAttributeValue & { attribute: { name: string } })[];
}) | null;

type VariantRow = {
  id?: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  color: string;
  size: string;
  stock: string;
  reserved?: number;
};

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: FullProduct;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [basePrice, setBasePrice] = useState(product ? String(product.basePrice) : "");
  const defaultCompare = product?.variants[0]?.compareAtPrice ? String(product.variants[0].compareAtPrice) : "";
  const [compareAtPrice, setCompareAtPrice] = useState(defaultCompare);
  const [status, setStatus] = useState<string>(product?.status ?? "DRAFT");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);

  function handleBasePriceChange(val: string) {
    setBasePrice(val);
    setVariants((prev) =>
      prev.map((v) => (v.price === basePrice || !v.price ? { ...v, price: val } : v))
    );
  }

  function handleCompareAtPriceChange(val: string) {
    setCompareAtPrice(val);
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        compareAtPrice: v.compareAtPrice === compareAtPrice || !v.compareAtPrice ? val : v.compareAtPrice,
      }))
    );
  }

  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => {
      const opts = v.options as { color?: string; size?: string };
      return {
        id: v.id,
        sku: v.sku,
        price: String(v.price),
        compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
        color: opts.color ?? "",
        size: opts.size ?? "",
        stock: String(v.inventory?.quantity ?? 0),
        reserved: v.inventory?.reserved ?? 0,
      };
    }) ?? [
      {
        sku: "",
        price: basePrice,
        compareAtPrice: "",
        color: "",
        size: "",
        stock: "0",
        reserved: 0,
      },
    ]
  );

  const [imageUrl, setImageUrl] = useState(product?.images[0]?.imageUrl ?? "");
  const [images, setImages] = useState<string[]>(
    product?.images.map((i) => i.imageUrl) ?? []
  );

  function generateSlug() {
    const s = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(s);
  }

  function addVariant() {
    setVariants((v) => [
      ...v,
      { sku: "", price: basePrice, compareAtPrice: "", color: "", size: "", stock: "0" },
    ]);
  }

  function removeVariant(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, field: keyof VariantRow, value: string) {
    setVariants((v) => v.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  }

  function addImage() {
    if (imageUrl.trim()) {
      setImages((arr) => [...arr, imageUrl.trim()]);
      setImageUrl("");
    }
  }

  function removeImage(idx: number) {
    setImages((arr) => arr.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (variants.length === 0) {
      toast({ title: "Add at least one variant", variant: "destructive" });
      return;
    }
    if (!categoryId) {
      toast({ title: "Select a category", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await saveProductAction({
        id: product?.id,
        name,
        slug: slug || undefined,
        shortDescription: shortDescription || undefined,
        description: description || undefined,
        categoryId,
        brand: brand || undefined,
        basePrice,
        status: status as "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED",
        isFeatured,
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice || undefined,
          color: v.color || undefined,
          size: v.size || undefined,
          stock: v.stock,
        })),
        images,
      });

      if (!result.ok) {
        toast({ title: "Save failed", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Product saved", description: name });
      router.push("/admin/products");
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"? This will archive the product.`)) return;
    startTransition(async () => {
      try {
        const result = await deleteProductAction(product.id);
        if (!result.ok) {
          toast({ title: "Delete failed", description: result.error, variant: "destructive" });
          return;
        }
        toast({ title: "Product archived" });
        router.push("/admin/products");
        router.refresh();
      } catch (err) {
        console.error("Product delete error:", err);
        toast({
          title: "Delete failed",
          description: (err as Error).message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={generateSlug}
              placeholder="e.g. Oxford Casual Shirt"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="oxford-casual-shirt"
            />
          </div>
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Budget King"
            />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Premium regular-fit cotton shirt."
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Material, fit, care instructions, features..."
            />
          </div>
          <div>
            <Label htmlFor="basePrice">Sale / Base Price (৳) *</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              required
              value={basePrice}
              onChange={(e) => handleBasePriceChange(e.target.value)}
              placeholder="600"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Price the customer pays.</p>
          </div>

          <div>
            <Label htmlFor="compareAtPrice">Original / Compare At Price (৳)</Label>
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              value={compareAtPrice}
              onChange={(e) => handleCompareAtPriceChange(e.target.value)}
              placeholder="1000"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Set higher to create a strikethrough discount.</p>
          </div>

          {/* Live Discount & Offer Page Preview */}
          {Number(compareAtPrice) > Number(basePrice) && Number(basePrice) > 0 && (
            <div className="sm:col-span-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-rose-600 text-white font-bold">
                  -{Math.round(((Number(compareAtPrice) - Number(basePrice)) / Number(compareAtPrice)) * 100)}% OFF
                </Badge>
                <span className="text-xs text-foreground font-medium">
                  Strikethrough Price: <span className="line-through text-muted-foreground">৳{compareAtPrice}</span> → <span className="font-bold text-rose-600">৳{basePrice}</span>
                </span>
              </div>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full">
                🔥 Auto-included in Offers Page
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 sm:col-span-2 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
              />
              <span className="font-medium">Featured product</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Variants
            <Button type="button" size="sm" variant="outline" onClick={addVariant}>
              <Plus className="mr-1 h-4 w-4" /> Add Variant
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Each variant creates a unique SKU and inventory entry.
          </p>
          {variants.map((v, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-md border p-3 sm:grid-cols-7 sm:items-end"
            >
              <div>
                <Label className="text-xs">Color</Label>
                <Input
                  value={v.color}
                  onChange={(e) => updateVariant(idx, "color", e.target.value)}
                  placeholder="Black"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Size</Label>
                <Input
                  value={v.size}
                  onChange={(e) => updateVariant(idx, "size", e.target.value)}
                  placeholder="XL"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">SKU</Label>
                <Input
                  value={v.sku}
                  onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                  placeholder="OXF-BLK-XL"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={v.price}
                  onChange={(e) => updateVariant(idx, "price", e.target.value)}
                  placeholder="699"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Compare At</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={v.compareAtPrice}
                  onChange={(e) => updateVariant(idx, "compareAtPrice", e.target.value)}
                  placeholder="899"
                  className="h-9"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Stock</Label>
                  {(v.reserved ?? 0) > 0 && (
                    <span
                      className="text-[10px] text-amber-600 font-semibold"
                      title={`${v.reserved} reserved by orders, ${Math.max(0, parseInt(v.stock || "0", 10) - (v.reserved ?? 0))} available`}
                    >
                      ({v.reserved} res / {Math.max(0, parseInt(v.stock || "0", 10) - (v.reserved ?? 0))} avail)
                    </span>
                  )}
                </div>
                <Input
                  type="number"
                  value={v.stock}
                  onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                  placeholder="0"
                  className="h-9"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeVariant(idx)}
                disabled={variants.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... or /path/to/image.jpg"
            />
            <Button type="button" onClick={addImage}>Add</Button>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square overflow-hidden rounded-md border bg-muted"
                >
                  <img src={img} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <Badge className="absolute top-1 left-1 text-xs">Primary</Badge>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removeImage(idx)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            First image is used as the primary image. Use full URLs for now — Supabase Storage upload comes in a later phase.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap justify-between gap-3">
        {product && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={pending}
            className="text-destructive hover:text-destructive"
          >
            Archive Product
          </Button>
        )}
        <div className="flex gap-3 ml-auto">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Product
          </Button>
        </div>
      </div>
    </form>
  );
}
