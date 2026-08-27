// Cart line item used by both client store and server actions.
// The browser never sends prices — only variantId + quantity.
// The server re-reads live prices at checkout.
export type CartLine = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  variantLabel: string;
  sku: string;
  image?: string;
  unitPrice: number; // display only — server recalculates
  quantity: number;
};

export type CartLineInput = Omit<CartLine, "unitPrice"> & { unitPrice?: number };

// Address payload used by checkout
export type AddressPayload = {
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area?: string;
  addressLine: string;
  label?: string;
};

// Checkout payload submitted to placeOrder()
export type CheckoutInput = {
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  address: AddressPayload;
  deliveryZoneId: string;
  notes?: string;
  voucherCode?: string; // Phase 5
  lines: Array<Pick<CartLine, "variantId" | "quantity">>;
};

// Result of placeOrder
export type CheckoutResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };
