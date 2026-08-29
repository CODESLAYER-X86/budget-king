"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { headers } from "next/headers";
import { notifyGroupEvent } from "@/lib/notifications";

// ============================================================
// Create a new group — caller becomes the OWNER
// ============================================================
const CreateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  maxMembers: z.number().int().min(2).max(50).default(20),
  deliveryZoneId: z.string().optional(),
});

export async function createGroupAction(input: unknown): Promise<
  { ok: true; groupId: string; code: string } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Please sign in to create a group" };

  // Rate limit: 3 groups per user per day
  const rl = rateLimit({
    key: `group:create:${session.id}`,
    limit: RATE_LIMITS.GROUP_CREATE.limit,
    windowMs: RATE_LIMITS.GROUP_CREATE.windowMs,
  });
  if (!rl.ok) return { ok: false, error: "Too many groups created today. Try again tomorrow." };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Generate unique 6-char invite code: BK-XXXXX
  const code = `BK-${generateCode(5)}`;
  // Verify uniqueness (5 chars = ~30 bits, collision risk low)
  const existing = await db.group.findUnique({ where: { code } });
  if (existing) return { ok: false, error: "Code collision, please retry" };

  try {
    const group = await db.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name: data.name,
          description: data.description,
          code,
          ownerId: session.id,
          maxMembers: data.maxMembers,
          deliveryZoneId: data.deliveryZoneId ?? null,
        },
      });
      // Add owner as a member with role OWNER
      await tx.groupMember.create({
        data: { groupId: g.id, userId: session.id, role: "OWNER" },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.id,
          actorRole: "CUSTOMER",
          action: "group.create",
          target: `group:${g.id}`,
          details: { name: g.name, code } as any,
        },
      });
      return g;
    });
    return { ok: true, groupId: group.id, code: group.code };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Join a group via invite code
// ============================================================
export async function joinGroupAction(
  code: string
): Promise<{ ok: true; groupId: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Please sign in to join a group" };

  // Rate limit: 10 join attempts per user per hour
  const rl = rateLimit({
    key: `group:join:${session.id}`,
    limit: RATE_LIMITS.GROUP_JOIN.limit,
    windowMs: RATE_LIMITS.GROUP_JOIN.windowMs,
  });
  if (!rl.ok) return { ok: false, error: "Too many join attempts. Please try later." };

  const group = await db.group.findUnique({
 where: { code: code.toUpperCase().trim() } });
  if (!group) return { ok: false, error: "Group code not found" };
  if (group.status !== "ACTIVE") {
    return { ok: false, error: `Group is ${group.status.toLowerCase()}` };
  }

  // Already a member?
  const existing = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.id } },
  });
  if (existing) return { ok: true, groupId: group.id }; // idempotent

  // Check member limit
  const memberCount = await db.groupMember.count({ where: { groupId: group.id } });
  if (memberCount >= group.maxMembers) {
    return { ok: false, error: "Group is full" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.groupMember.create({
        data: { groupId: group.id, userId: session.id, role: "MEMBER" },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.id,
          actorRole: "CUSTOMER",
          action: "group.join",
          target: `group:${group.id}`,
        },
      });
    });
    // Notify group owner (and others) about the new member
    await notifyGroupEvent(
      group.id,
      group.name,
      "MEMBER_JOINED",
      { actorName: session.profile?.fullName ?? session.email, memberCount: undefined }
    ).catch(() => {});
    return { ok: true, groupId: group.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Leave a group (owner cannot leave — they must close the group)
// ============================================================
export async function leaveGroupAction(
  groupId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.id } },
  });
  if (!membership) return { ok: false, error: "You're not a member" };
  if (membership.role === "OWNER") {
    return { ok: false, error: "Owner cannot leave. Close the group instead." };
  }

  // Remove the user's group cart items + votes
  await db.$transaction(async (tx) => {
    await tx.groupCartItem.deleteMany({ where: { groupId, userId: session.id } });
    await tx.groupVote.deleteMany({ where: { userId: session.id, groupProduct: { groupId } } });
    await tx.groupMember.delete({ where: { id: membership.id } });
    await tx.auditLog.create({
      data: {
        actorId: session.id,
        actorRole: "CUSTOMER",
        action: "group.leave",
        target: `group:${groupId}`,
      },
    });
  });
  return { ok: true };
}

// ============================================================
// Close a group (owner only)
// ============================================================
export async function closeGroupAction(
  groupId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) return { ok: false, error: "Group not found" };
  if (group.ownerId !== session.id && !["ADMIN", "MODERATOR"].includes(session.profile.role)) {
    return { ok: false, error: "Only the owner can close the group" };
  }

  await db.group.update({
    where: { id: groupId },
    data: { status: "CLOSED" },
  });
  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: session.profile.role,
      action: "group.close",
      target: `group:${groupId}`,
    },
  });
  return { ok: true };
}

// ============================================================
// Transfer group ownership to another member
// ============================================================
export async function transferGroupOwnershipAction(
  groupId: string,
  newOwnerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) return { ok: false, error: "Group not found" };
  if (group.ownerId !== session.id) {
    return { ok: false, error: "Only the owner can transfer ownership" };
  }

  // Verify the new owner is a member
  const newOwnerMembership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: newOwnerId } },
  });
  if (!newOwnerMembership) {
    return { ok: false, error: "The new owner must be a member of the group" };
  }

  await db.$transaction(async (tx) => {
    // Update group owner
    await tx.group.update({
      where: { id: groupId },
      data: { ownerId: newOwnerId },
    });
    // Update roles: old owner becomes MEMBER, new owner becomes OWNER
    await tx.groupMember.update({
      where: { groupId_userId: { groupId, userId: session.id } },
      data: { role: "MEMBER" },
    });
    await tx.groupMember.update({
      where: { groupId_userId: { groupId, userId: newOwnerId } },
      data: { role: "OWNER" },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.id,
        actorRole: session.profile.role,
        action: "group.transfer_ownership",
        target: `group:${groupId}`,
        details: { newOwnerId } as any,
      },
    });
  });
  return { ok: true };
}

// ============================================================
// Delete a group (owner only)
// ============================================================
export async function deleteGroupAction(
  groupId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) return { ok: false, error: "Group not found" };
  if (group.ownerId !== session.id && !["ADMIN", "MODERATOR"].includes(session.profile.role)) {
    return { ok: false, error: "Only the owner can delete the group" };
  }

  await db.group.delete({ where: { id: groupId } });
  await db.auditLog.create({
    data: {
      actorId: session.id,
      actorRole: session.profile.role,
      action: "group.delete",
      target: `group:${groupId}`,
    },
  });
  return { ok: true };
}

// ============================================================
// Share a product into a group's feed
// ============================================================
const ShareSchema = z.object({
  groupId: z.string(),
  productId: z.string(),
  note: z.string().max(280).optional(),
});

export async function shareProductToGroupAction(
  input: unknown
): Promise<{ ok: true; groupProductId: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const parsed = ShareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { groupId, productId, note } = parsed.data;

  // Verify membership
  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.id } },
  });
  if (!membership) return { ok: false, error: "You're not a member of this group" };

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group || group.status !== "ACTIVE") {
    return { ok: false, error: "Group is not active" };
  }

  // Check product isn't already shared
  const existing = await db.groupProduct.findUnique({
    where: { groupId_productId: { groupId, productId } },
  });
  if (existing) return { ok: true, groupProductId: existing.id }; // idempotent

  try {
    const gp = await db.groupProduct.create({
      data: { groupId, userId: session.id, productId, note },
    });
    // Notify group members about the shared product
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });
    await notifyGroupEvent(
      groupId,
      group.name,
      "PRODUCT_SHARED",
      {
        actorName: session.profile?.fullName ?? session.email,
        productName: product?.name,
      }
    ).catch(() => {});
    return { ok: true, groupProductId: gp.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Vote (up/down) on a shared product — toggles on re-vote
// ============================================================
export async function voteOnGroupProductAction(
  groupProductId: string,
  type: "UP" | "DOWN"
): Promise<{ ok: true; newType: "UP" | "DOWN" | null } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const gp = await db.groupProduct.findUnique({ where: { id: groupProductId } });
  if (!gp) return { ok: false, error: "Shared product not found" };

  // Verify membership
  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: gp.groupId, userId: session.id } },
  });
  if (!membership) return { ok: false, error: "You're not a member of this group" };

  const existing = await db.groupVote.findUnique({
    where: { groupProductId_userId: { groupProductId, userId: session.id } },
  });

  // If same type → remove vote (toggle off)
  if (existing && existing.type === type) {
    await db.groupVote.delete({ where: { id: existing.id } });
    return { ok: true, newType: null };
  }

  // Upsert
  if (existing) {
    await db.groupVote.update({
      where: { id: existing.id },
      data: { type },
    });
  } else {
    await db.groupVote.create({
      data: { groupProductId, userId: session.id, type },
    });
  }
  return { ok: true, newType: type };
}

// ============================================================
// Add product to group cart (each member has their own qty)
// ============================================================
const AddToCartSchema = z.object({
  groupId: z.string(),
  groupProductId: z.string(),
  variantId: z.string(),
  quantity: z.number().int().min(1).max(10).default(1),
});

export async function addToGroupCartAction(
  input: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const parsed = AddToCartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { groupId, groupProductId, variantId, quantity } = parsed.data;

  // Verify membership
  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.id } },
  });
  if (!membership) return { ok: false, error: "You're not a member of this group" };

  // Verify the group product belongs to this group
  const gp = await db.groupProduct.findUnique({ where: { id: groupProductId } });
  if (!gp || gp.groupId !== groupId) {
    return { ok: false, error: "Product not in this group" };
  }

  // Check stock availability
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true },
  });
  if (!variant) return { ok: false, error: "Variant not found" };
  const available = (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
  if (available < quantity) {
    return { ok: false, error: `Only ${available} in stock` };
  }

  try {
    // GroupCartItem has @unique on groupProductId — one cart entry per shared product
    await db.groupCartItem.upsert({
      where: { groupProductId },
      create: {
        groupId,
        groupProductId,
        userId: session.id,
        variantId,
        quantity,
      },
      update: {
        userId: session.id, // last editor owns the cart entry
        variantId,
        quantity,
      },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Update group cart item qty / remove
// ============================================================
export async function updateGroupCartItemQtyAction(
  cartItemId: string,
  quantity: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const item = await db.groupCartItem.findUnique({ where: { id: cartItemId } });
  if (!item) return { ok: false, error: "Cart item not found" };
  if (item.userId !== session.id && !["ADMIN", "MODERATOR"].includes(session.profile.role)) {
    return { ok: false, error: "You can only edit your own cart items" };
  }

  if (quantity <= 0) {
    await db.groupCartItem.delete({ where: { id: cartItemId } });
  } else {
    await db.groupCartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }
  return { ok: true };
}

// ============================================================
// Get a customer's groups (membership + owned)
// ============================================================
export async function getMyGroups() {
  const session = await getSession();
  if (!session?.profile) return [];

  const memberships = await db.groupMember.findMany({
    where: { userId: session.id },
    include: {
      group: {
        include: {
          owner: { select: { fullName: true, email: true } },
          _count: { select: { members: true, products: true, cartItems: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
  return memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    code: m.group.code,
    status: m.group.status,
    role: m.role,
    ownerName: m.group.owner.fullName ?? m.group.owner.email.split("@")[0],
    ownerId: m.group.ownerId,
    memberCount: m.group._count.members,
    productCount: m.group._count.products,
    cartItemCount: m.group._count.cartItems,
    joinedAt: m.joinedAt.toISOString(),
    createdAt: m.group.createdAt.toISOString(),
  }));
}

// ============================================================
// Get group detail (members, products, votes, cart)
// ============================================================
export async function getGroupDetail(groupId: string) {
  const session = await getSession();
  if (!session?.profile) return null;

  // Verify membership
  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.id } },
  });
  if (!membership) return null;

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      owner: { select: { fullName: true, email: true } },
      members: {
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      products: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              variants: {
                where: { status: "ACTIVE" },
                select: {
                  id: true,
                  price: true,
                  options: true,
                  inventory: { select: { quantity: true, reserved: true } },
                },
                orderBy: { price: "asc" },
              },
            },
          },
          user: { select: { fullName: true, email: true } },
          votes: { select: { userId: true, type: true } },
          cartItem: true,
        },
        orderBy: { createdAt: "desc" },
      },
      cartItems: {
        include: {
          user: { select: { fullName: true, email: true } },
          variant: {
            include: {
              product: { select: { name: true, slug: true } },
            },
          },
          groupProduct: { include: { product: { select: { name: true, slug: true } } } },
        },
        orderBy: { addedAt: "desc" },
      },
      deliveryZone: true,
    },
  });
  if (!group) return null;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    code: group.code,
    status: group.status,
    ownerId: group.ownerId,
    ownerName: group.owner.fullName ?? group.owner.email,
    maxMembers: group.maxMembers,
    deliveryZoneId: group.deliveryZoneId,
    deliveryAddressJson: group.deliveryAddressJson,
    createdAt: group.createdAt.toISOString(),
    myRole: membership.role,
    members: group.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.fullName ?? m.user.email,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })),
    products: group.products.map((gp) => {
      const opts = gp.product.variants[0]?.options as { color?: string; size?: string } | null;
      const upVotes = gp.votes.filter((v) => v.type === "UP").length;
      const downVotes = gp.votes.filter((v) => v.type === "DOWN").length;
      const myVote = gp.votes.find((v) => v.userId === session.id)?.type ?? null;
      const minPrice = gp.product.variants.length > 0
        ? Math.min(...gp.product.variants.map((v) => Number(v.price)))
        : Number(gp.product.variants[0]?.price ?? 0);
      return {
        id: gp.id,
        productId: gp.productId,
        productName: gp.product.name,
        productSlug: gp.product.slug,
        productImage: gp.product.images[0]?.imageUrl ?? null,
        minPrice,
        variants: gp.product.variants.map((v) => ({
          id: v.id,
          price: Number(v.price),
          options: v.options as { color?: string; size?: string },
          available: (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0),
        })),
        note: gp.note,
        sharedBy: gp.user.fullName ?? gp.user.email,
        sharedAt: gp.createdAt.toISOString(),
        upVotes,
        downVotes,
        myVote,
        inCart: !!gp.cartItem,
      };
    }),
    cartItems: group.cartItems.map((c) => ({
      id: c.id,
      userId: c.userId,
      userName: c.user.fullName ?? c.user.email,
      productName: c.variant.product.name,
      productSlug: c.variant.product.slug,
      variantId: c.variantId,
      variantLabel: formatVariantLabel(c.variant.options),
      unitPrice: Number(c.variant.price),
      quantity: c.quantity,
      addedAt: c.addedAt.toISOString(),
    })),
  };
}

function formatVariantLabel(options: unknown): string {
  const opts = options as { color?: string; size?: string } | null;
  return [opts?.color, opts?.size].filter(Boolean).join(" / ") || "Default";
}

// ============================================================
// Place a group order — combines all group cart items into one
// COD order, with shared delivery charge.
// The caller (group owner) becomes the order's customer.
// ============================================================
const PlaceGroupOrderSchema = z.object({
  groupId: z.string(),
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^01[0-9]{9}$/),
  customerEmail: z.string().email().optional().or(z.literal("")),
  address: z.object({
    fullName: z.string().min(2),
    phone: z.string().regex(/^01[0-9]{9}$/),
    division: z.string().min(2),
    district: z.string().min(2),
    area: z.string().optional(),
    addressLine: z.string().min(5),
  }),
  deliveryZoneId: z.string(),
  notes: z.string().max(1000).optional(),
});

export async function placeGroupOrderAction(
  input: unknown
): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  const parsed = PlaceGroupOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Verify caller is the group owner
  const group = await db.group.findUnique({
    where: { id: data.groupId },
    include: { cartItems: { include: { variant: true } } },
  });
  if (!group) return { ok: false, error: "Group not found" };
  if (group.ownerId !== session.id) {
    return { ok: false, error: "Only the group owner can place the group order" };
  }
  if (group.status !== "ACTIVE") {
    return { ok: false, error: `Group is ${group.status.toLowerCase()}` };
  }
  if (group.cartItems.length === 0) {
    return { ok: false, error: "Group cart is empty" };
  }

  try {
    const order = await db.$transaction(async (tx) => {
      // Fetch delivery zone
      const zone = await tx.deliveryZone.findUnique({ where: { id: data.deliveryZoneId } });
      if (!zone || !zone.isActive) throw new Error("Delivery zone unavailable");

      // Validate all variants exist + have stock
      const variantIds = group.cartItems.map((c) => c.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds }, status: "ACTIVE" },
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          inventory: true,
        },
      });
      if (variants.length !== variantIds.length) {
        throw new Error("One or more products no longer available");
      }
      for (const item of group.cartItems) {
        const v = variants.find((x) => x.id === item.variantId);
        if (!v) throw new Error("Variant not found");
        const available = (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0);
        if (available < item.quantity) {
          throw new Error(`Insufficient stock for ${v.product.name}`);
        }
      }

      // Generate order number
      const year = new Date().getFullYear();
      const prefix = `BK-${year}-`;
      const lastOrder = await tx.order.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: "desc" },
      });
      const nextSeq = lastOrder ? parseInt(lastOrder.orderNumber.split("-")[2], 10) + 1 : 1;
      const orderNumber = `${prefix}${String(nextSeq).padStart(6, "0")}`;

      // Calculate totals (server-authoritative)
      let subtotal = 0;
      const orderItemsData = group.cartItems.map((c) => {
        const v = variants.find((x) => x.id === c.variantId)!;
        const unitPrice = Number(v.price);
        const totalPrice = unitPrice * c.quantity;
        subtotal += totalPrice;
        const opts = v.options as { color?: string; size?: string };
        const variantLabel = [opts.color, opts.size].filter(Boolean).join(" / ");
        return {
          productId: v.productId,
          variantId: v.id,
          quantity: c.quantity,
          unitPrice: v.price,
          totalPrice,
          productName: v.product.name,
          variantLabel,
          productImage: v.product.images[0]?.imageUrl ?? null,
          productSku: v.sku,
        };
      });

      const deliveryCharge = Number(zone.charge);
      const total = subtotal + deliveryCharge;

      // Create order (userId = owner; groupOrderId = group.id)
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session.id,
          status: "PENDING",
          paymentMethod: "COD",
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          deliveryAddressJson: {
            fullName: data.address.fullName,
            phone: data.address.phone,
            division: data.address.division,
            district: data.address.district,
            area: data.address.area ?? null,
            addressLine: data.address.addressLine,
          },
          deliveryZoneId: zone.id,
          deliveryCharge: zone.charge,
          subtotal,
          discount: 0,
          total,
          notes: data.notes ?? `[Group order: ${group.name} (${group.code})]`,
          groupOrderId: group.id,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      // Reserve stock + record movements
      for (const item of group.cartItems) {
        const v = variants.find((x) => x.id === item.variantId)!;
        const inv = v.inventory;
        if (!inv) continue;
        await tx.inventory.update({
          where: { id: inv.id },
          data: { reserved: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            type: "RESERVED",
            quantity: item.quantity,
            refOrderId: order.id,
            note: `Reserved for group order ${orderNumber}`,
          },
        });
      }

      // Initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          note: `Group order placed by ${session.email} for group ${group.name}`,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: session.id,
          actorRole: "CUSTOMER",
          action: "group.order.create",
          target: `order:${orderNumber}`,
          details: {
            groupId: group.id,
            groupName: group.name,
            total,
            itemCount: group.cartItems.length,
          } as any,
        },
      });

      return order;
    });

    // Notify group members about the placed order
    await notifyGroupEvent(
      group.id,
      group.name,
      "ORDER_PLACED",
      { actorName: session.profile?.fullName ?? session.email }
    ).catch(() => {});

    return { ok: true, orderNumber: order.orderNumber };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Helpers
// ============================================================
function generateCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
