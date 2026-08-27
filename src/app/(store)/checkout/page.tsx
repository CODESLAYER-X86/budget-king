import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CheckoutClient } from "./checkout-client";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();

  const [deliveryZones, addresses] = await Promise.all([
    db.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { charge: "asc" },
    }),
    session
      ? db.address.findMany({
          where: { userId: session.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        })
      : [],
  ]);

  if (deliveryZones.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Checkout unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Delivery zones have not been configured yet. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <CheckoutClient
      deliveryZones={deliveryZones.map((z) => ({
        id: z.id,
        name: z.name,
        charge: Number(z.charge),
        estimatedDays: z.estimatedDays,
        divisions: z.divisions,
      }))}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        fullName: a.fullName,
        phone: a.phone,
        division: a.division,
        district: a.district,
        area: a.area ?? "",
        addressLine: a.addressLine,
        isDefault: a.isDefault,
      }))}
      user={
        session?.profile
          ? {
              fullName: session.profile.fullName ?? "",
              phone: session.profile.phone ?? "",
              email: session.email,
            }
          : null
      }
    />
  );
}
