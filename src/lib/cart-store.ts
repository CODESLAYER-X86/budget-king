"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, CartLineInput } from "@/types/cart";

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (line: CartLineInput) => void;
  remove: (variantId: string) => void;
  setQuantity: (variantId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      setOpen: (open) => set({ isOpen: open }),
      add: (line) => {
        const existing = get().lines.find((l) => l.variantId === line.variantId);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.variantId === line.variantId
                ? { ...l, quantity: l.quantity + line.quantity }
                : l
            ),
            isOpen: true,
          });
        } else {
          set({
            lines: [
              ...get().lines,
              {
                variantId: line.variantId,
                productId: line.productId,
                name: line.name,
                slug: line.slug,
                variantLabel: line.variantLabel,
                sku: line.sku,
                image: line.image,
                unitPrice: line.unitPrice ?? 0,
                quantity: line.quantity,
              },
            ],
            isOpen: true,
          });
        }
      },
      remove: (variantId) =>
        set({ lines: get().lines.filter((l) => l.variantId !== variantId) }),
      setQuantity: (variantId, qty) => {
        if (qty <= 0) {
          set({ lines: get().lines.filter((l) => l.variantId !== variantId) });
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: qty } : l
          ),
        });
      },
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: () =>
        get().lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
    }),
    { name: "bkbd-cart" }
  )
);
