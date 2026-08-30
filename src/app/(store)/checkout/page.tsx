import { db } from "@/lib/db";
import { CheckoutClient } from "./checkout-client";
import { getSession } from "@/lib/auth/session";
import { getCoinBalance } from "@/actions/rewards";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let user: { fullName: string; phone: string; email: string } | null = null;
  let coinBalance = 0;
  let savedAddresses: Array<{
    id: string;
    label: string | null;
    fullName: string;
    phone: string;
    division: string;
    district: string;
    area: string;
    addressLine: string;
    isDefault: boolean;
  }> = [];

  try {
    const session = await getSession();
    if (session?.profile) {
      user = {
        fullName: session.profile.fullName ?? "",
        phone: session.profile.phone ?? "",
        email: session.profile.email,
      };

      const [addresses, balance] = await Promise.all([
        db.address.findMany({
          where: { userId: session.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          take: 5,
        }),
        getCoinBalance(session.id).catch(() => 0),
      ]);

      coinBalance = balance;
      savedAddresses = addresses.map((a) => ({
        id: a.id,
        label: a.label,
        fullName: a.fullName,
        phone: a.phone,
        division: a.division,
        district: a.district,
        area: a.area ?? "",
        addressLine: a.addressLine,
        isDefault: a.isDefault,
      }));
    }
  } catch {
    // If auth/DB fails, just show guest checkout
  }

  // Fetch delivery zones (required for checkout)
  let deliveryZones: Array<{
    id: string;
    name: string;
    charge: any;
    estimatedDays: number;
    divisions: string[];
    isActive: boolean;
  }> = [];

  try {
    deliveryZones = await db.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { charge: "asc" },
    });
  } catch {
    // DB error — show error message
  }

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
      addresses={savedAddresses}
      user={user}
      coinBalance={coinBalance}
    />
  );
}
