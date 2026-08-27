import { db } from "@/lib/db";
import { DeliveryZoneManager } from "./delivery-zone-manager";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryZonesPage() {
  const zones = await db.deliveryZone.findMany({
    orderBy: { charge: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Delivery Zones</h1>
        <p className="text-sm text-muted-foreground">
          Configure delivery charges by zone.
        </p>
      </div>
      <DeliveryZoneManager zones={zones} />
    </div>
  );
}
