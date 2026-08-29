"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  Trash2,
  Loader2,
  Copy,
  Check,
  Crown,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTk } from "@/lib/utils/currency";
import {
  voteOnGroupProductAction,
  addToGroupCartAction,
  updateGroupCartItemQtyAction,
  closeGroupAction,
  transferGroupOwnershipAction,
  deleteGroupAction,
  placeGroupOrderAction,
} from "@/actions/groups";

type Variant = {
  id: string;
  price: number;
  options: { color?: string; size?: string };
  available: number;
};

type GroupProduct = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  minPrice: number;
  variants: Variant[];
  note: string | null;
  sharedBy: string;
  sharedAt: string;
  upVotes: number;
  downVotes: number;
  myVote: "UP" | "DOWN" | null;
  inCart: boolean;
};

type CartItem = {
  id: string;
  userId: string;
  userName: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  addedAt: string;
};

type Member = {
  id: string;
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
};

type Group = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  status: string;
  ownerId: string;
  ownerName: string;
  maxMembers: number;
  myRole: string;
  createdAt: string;
  members: Member[];
  products: GroupProduct[];
  cartItems: CartItem[];
};

type DeliveryZone = {
  id: string;
  name: string;
  charge: number;
  estimatedDays: number;
};

export function GroupDetailClient({
  group,
  deliveryZones,
}: {
  group: Group;
  deliveryZones: DeliveryZone[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const isOwner = group.myRole === "OWNER";

  function copyCode() {
    navigator.clipboard?.writeText(group.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleVote(groupProductId: string, type: "UP" | "DOWN") {
    startTransition(async () => {
      const result = await voteOnGroupProductAction(groupProductId, type);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  function handleAddToCart(gp: GroupProduct) {
    // Use first available variant (admin can refine later)
    const availableVariant = gp.variants.find((v) => v.available > 0);
    if (!availableVariant) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const result = await addToGroupCartAction({
        groupId: group.id,
        groupProductId: gp.id,
        variantId: availableVariant.id,
        quantity: 1,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Added to group cart" });
      router.refresh();
    });
  }

  function handleUpdateQty(cartItemId: string, qty: number) {
    startTransition(async () => {
      const result = await updateGroupCartItemQtyAction(cartItemId, qty);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  function handleClose() {
    if (!confirm("Close this group? Members won't be able to add items anymore.")) return;
    startTransition(async () => {
      const result = await closeGroupAction(group.id);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Group closed" });
      router.push("/groups");
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
              {group.myRole === "OWNER" && (
                <Badge className="text-xs"><Crown className="mr-1 h-3 w-3" /> Owner</Badge>
              )}
              {group.status !== "ACTIVE" && (
                <Badge variant="secondary">{group.status}</Badge>
              )}
            </div>
            {group.description && (
              <p className="mt-1 text-sm text-muted-foreground max-w-prose">{group.description}</p>
            )}
          </div>
          <button
            onClick={copyCode}
            className="font-mono text-sm font-semibold bg-secondary px-3 py-2 rounded-md hover:bg-accent flex items-center gap-1"
          >
            {group.code}
            {copiedCode ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>👥 {group.members.length} / {group.maxMembers} members</span>
          <span>👕 {group.products.length} products shared</span>
          <span>🛒 {group.cartItems.length} items in cart</span>
          <span>Owner: {group.ownerName}</span>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products ({group.products.length})</TabsTrigger>
          <TabsTrigger value="cart">Group Cart ({group.cartItems.length})</TabsTrigger>
          <TabsTrigger value="members">Members ({group.members.length})</TabsTrigger>
        </TabsList>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="space-y-3">
          {group.products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                <ShoppingBag className="mx-auto h-10 w-10 mb-2 text-muted-foreground/50" />
                No products shared yet.
                <br />
                Browse the <Link href="/shop" className="text-primary hover:underline">shop</Link> and
                use the &quot;Share to Group&quot; button to add products here.
              </CardContent>
            </Card>
          ) : (
            group.products.map((gp) => (
              <Card key={gp.id}>
                <CardContent className="p-4 flex gap-4">
                  <Link
                    href={`/product/${gp.productSlug}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
                  >
                    {gp.productImage ? (
                      <Image
                        src={gp.productImage}
                        alt={gp.productName}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No img
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/product/${gp.productSlug}`}
                          className="font-medium text-sm hover:text-primary"
                        >
                          {gp.productName}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Shared by {gp.sharedBy} • {new Date(gp.sharedAt).toLocaleDateString("en-BD")}
                        </p>
                        {gp.note && (
                          <p className="text-xs italic mt-1 text-muted-foreground">&quot;{gp.note}&quot;</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatTk(gp.minPrice)}</p>
                        {gp.inCart && <Badge variant="secondary" className="text-xs">In cart</Badge>}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Votes */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={gp.myVote === "UP" ? "default" : "outline"}
                          className="h-8 px-2"
                          onClick={() => handleVote(gp.id, "UP")}
                          disabled={pending}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span className="ml-1 text-xs">{gp.upVotes}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={gp.myVote === "DOWN" ? "destructive" : "outline"}
                          className="h-8 px-2"
                          onClick={() => handleVote(gp.id, "DOWN")}
                          disabled={pending}
                        >
                          <ThumbsDown className="h-3 w-3" />
                          <span className="ml-1 text-xs">{gp.downVotes}</span>
                        </Button>
                      </div>
                      {/* Add to group cart */}
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(gp)}
                        disabled={pending || gp.inCart || gp.variants.every((v) => v.available <= 0)}
                      >
                        <ShoppingCart className="mr-1 h-3 w-3" />
                        {gp.inCart ? "Already in cart" : "Add to Group Cart"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* CART TAB */}
        <TabsContent value="cart" className="space-y-3">
          {group.cartItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Group cart is empty.
              </CardContent>
            </Card>
          ) : (
            <>
              {group.cartItems.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${c.productSlug}`}
                        className="font-medium text-sm hover:text-primary"
                      >
                        {c.productName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {c.variantLabel} • {c.quantity} × {formatTk(c.unitPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added by {c.userName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatTk(c.unitPrice * c.quantity)}</p>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => handleUpdateQty(c.id, c.quantity - 1)}
                          disabled={pending}
                        >
                          −
                        </Button>
                        <span className="text-xs px-1">{c.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => handleUpdateQty(c.id, c.quantity + 1)}
                          disabled={pending}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Group order summary */}
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span>{group.cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">
                      {formatTk(group.cartItems.reduce((s, c) => s + c.unitPrice * c.quantity, 0))}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    One combined COD order will be placed. Delivery charge calculated at checkout.
                  </p>
                  {isOwner ? (
                    <Button
                      className="mt-3 w-full"
                      onClick={() => setShowCheckout(true)}
                      disabled={pending || group.status !== "ACTIVE"}
                    >
                      Place Group Order
                    </Button>
                  ) : (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Only the group owner can place the group order.
                    </p>
                  )}
                </CardContent>
              </Card>

              {showCheckout && isOwner && (
                <GroupCheckoutForm
                  group={group}
                  deliveryZones={deliveryZones}
                  pending={pending}
                  startTransition={startTransition}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                <span>Members ({group.members.length}/{group.maxMembers})</span>
                {isOwner && group.status === "ACTIVE" && (
                  <Button size="sm" variant="outline" onClick={handleClose} disabled={pending}>
                    Close Group
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {group.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium flex items-center gap-1.5">
                        {m.name}
                        {m.role === "OWNER" && <Crown className="h-3 w-3 text-primary" />}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(m.joinedAt).toLocaleDateString("en-BD")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>
                        {m.role}
                      </Badge>
                      {isOwner && m.role !== "OWNER" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          disabled={pending}
                          onClick={() => {
                            if (!confirm(`Transfer ownership to ${m.name}? You will become a regular member.`)) return;
                            startTransition(async () => {
                              const result = await transferGroupOwnershipAction(group.id, m.userId);
                              if (!result.ok) {
                                toast({ title: "Failed", description: result.error, variant: "destructive" });
                                return;
                              }
                              toast({ title: "Ownership transferred!" });
                              router.push("/groups");
                              router.refresh();
                            });
                          }}
                        >
                          Make Owner
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {isOwner && (
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={pending}
              onClick={() => {
                if (!confirm("DELETE this group permanently? All members, products, and cart will be removed.")) return;
                startTransition(async () => {
                  const result = await deleteGroupAction(group.id);
                  if (!result.ok) {
                    toast({ title: "Failed", description: result.error, variant: "destructive" });
                    return;
                  }
                  toast({ title: "Group deleted" });
                  router.push("/groups");
                  router.refresh();
                });
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Group Permanently
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupCheckoutForm({
  group,
  deliveryZones,
  pending,
  startTransition,
}: {
  group: Group;
  deliveryZones: DeliveryZone[];
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    fullName: "",
    phone: "",
    division: "",
    district: "",
    area: "",
    addressLine: "",
    deliveryZoneId: deliveryZones[0]?.id ?? "",
    notes: "",
  });
  const subtotal = group.cartItems.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const deliveryCharge = deliveryZones.find((z) => z.id === form.deliveryZoneId)?.charge ?? 0;
  const total = subtotal + deliveryCharge;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await placeGroupOrderAction({
        groupId: group.id,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || undefined,
        address: {
          fullName: form.fullName,
          phone: form.phone,
          division: form.division,
          district: form.district,
          area: form.area || undefined,
          addressLine: form.addressLine,
        },
        deliveryZoneId: form.deliveryZoneId,
        notes: form.notes || undefined,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Group order placed!", description: `Order ${result.orderNumber}` });
      router.push(`/order/${result.orderNumber}`);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Group Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Customer Name *</Label>
              <Input required value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Phone *</Label>
              <Input required pattern="01[0-9]{9}" value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="01XXXXXXXXX" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Recipient Name *</Label>
              <Input required value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Recipient Phone *</Label>
              <Input required pattern="01[0-9]{9}" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Division *</Label>
              <Input required value={form.division}
                onChange={(e) => setForm({ ...form, division: e.target.value })}
                className="h-9" />
            </div>
            <div>
              <Label className="text-xs">District *</Label>
              <Input required value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Area</Label>
              <Input value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Delivery Zone</Label>
              <select
                value={form.deliveryZoneId}
                onChange={(e) => setForm({ ...form, deliveryZoneId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {deliveryZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — tk {z.charge}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Full Address *</Label>
              <Textarea required rows={2} value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            </div>
          </div>

          <div className="rounded-md bg-secondary/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatTk(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery (shared)</span>
              <span>{formatTk(deliveryCharge)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t mt-1 pt-1">
              <span>Total (COD)</span>
              <span>{formatTk(total)}</span>
            </div>
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Place Group COD Order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
