"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { formatTk } from "@/lib/utils/currency";
import type { Product, ProductVariant, ProductImage } from "@prisma/client";

type FullProduct = Product & {
  images: ProductImage[];
  variants: (ProductVariant & {
    inventory: { quantity: number; reserved: number } | null;
  })[];
};

export function ProductDetailClient({
  product,
  colors,
  sizes,
}: {
  product: FullProduct;
  colors: string[];
  sizes: string[];
}) {
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const add = useCart((s) => s.add);
  const { toast } = useToast();
  const router = useRouter();

  // Find the variant matching the selected options
  const selectedVariant = useMemo(() => {
    return product.variants.find((v) => {
      const opts = v.options as { color?: string; size?: string };
      if (opts.color && opts.color !== selectedColor) return false;
      if (opts.size && opts.size !== selectedSize) return false;
      return true;
    });
  }, [product.variants, selectedColor, selectedSize]);

  const availableQty = selectedVariant
    ? Math.max(
        0,
        (selectedVariant.inventory?.quantity ?? 0) -
          (selectedVariant.inventory?.reserved ?? 0)
      )
    : 0;

  const isOutOfStock = selectedVariant ? availableQty <= 0 : true;

  function handleAddToCart() {
    if (!selectedVariant) {
      toast({
        title: "Please select options",
        description: "Choose a color and size to continue.",
        variant: "destructive",
      });
      return;
    }
    if (isOutOfStock) {
      toast({
        title: "Out of stock",
        description: "This variant is currently unavailable.",
        variant: "destructive",
      });
      return;
    }
    if (quantity > availableQty) {
      toast({
        title: "Not enough stock",
        description: `Only ${availableQty} available.`,
        variant: "destructive",
      });
      return;
    }

    const opts = selectedVariant.options as { color?: string; size?: string };
    const variantLabel = [opts.color, opts.size].filter(Boolean).join(" / ");

    add({
      variantId: selectedVariant.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      variantLabel,
      sku: selectedVariant.sku,
      image: product.images[0]?.imageUrl,
      unitPrice: Number(selectedVariant.price),
      quantity,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} (${variantLabel}) × ${quantity}`,
    });
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/checkout");
  }

  return (
    <div className="space-y-5">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">
          {formatTk(selectedVariant?.price ?? product.basePrice)}
        </span>
        {selectedVariant?.compareAtPrice &&
          Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price) && (
            <>
              <span className="text-base text-muted-foreground line-through">
                {formatTk(selectedVariant.compareAtPrice)}
              </span>
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                -
                {Math.round(
                  ((Number(selectedVariant.compareAtPrice) -
                    Number(selectedVariant.price)) /
                    Number(selectedVariant.compareAtPrice)) *
                    100
                )}
                %
              </span>
            </>
          )}
      </div>

      {/* Colors */}
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Color: <span className="text-muted-foreground">{selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  selectedColor === c
                    ? "border-primary bg-primary/10 font-medium"
                    : "hover:border-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Size: <span className="text-muted-foreground">{selectedSize}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                className={`min-w-[3rem] rounded-md border px-3 py-2 text-sm transition-colors ${
                  selectedSize === s
                    ? "border-primary bg-primary/10 font-medium"
                    : "hover:border-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock status */}
      <div>
        {selectedVariant ? (
          isOutOfStock ? (
            <p className="text-sm font-medium text-destructive">● Out of Stock</p>
          ) : availableQty <= 5 ? (
            <p className="text-sm font-medium text-amber-600">
              ● Only {availableQty} left in stock
            </p>
          ) : (
            <p className="text-sm font-medium text-green-600">● In Stock</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Select options to see stock</p>
        )}
      </div>

      {/* Quantity + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={quantity >= availableQty}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          size="lg"
          className="flex-1 min-w-[140px]"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>

        <Button
          size="lg"
          variant="default"
          className="flex-1 min-w-[140px]"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
        >
          <Zap className="mr-2 h-4 w-4" />
          Buy Now
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        SKU: {selectedVariant?.sku ?? "—"}
      </p>
    </div>
  );
}
