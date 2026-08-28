"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

/**
 * Mark a single notification as read.
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  // Verify the notification belongs to this user (or is broadcast to their role)
  const notif = await db.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notif) return { ok: false, error: "Not found" };
  if (notif.userId !== session.id && notif.roleTarget !== session.profile.role) {
    return { ok: false, error: "Not yours" };
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
  revalidatePath("/");
  return { ok: true };
}

/**
 * Mark all of the current user's notifications as read.
 */
export async function markAllNotificationsReadAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session?.profile) return { ok: false, error: "Unauthorized" };

  await db.notification.updateMany({
    where: {
      isRead: false,
      OR: [
        { userId: session.id },
        { userId: null, roleTarget: session.profile.role },
      ],
    },
    data: { isRead: true, readAt: new Date() },
  });
  revalidatePath("/");
  return { ok: true };
}
