import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AddressManager } from "@/components/customer/address-manager";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const session = await getSession();
  if (!session?.profile) redirect("/login?next=/addresses");

  const addresses = await db.address.findMany({
    where: { userId: session.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">My Addresses</h1>
      <AddressManager
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          fullName: a.fullName,
          phone: a.phone,
          division: a.division,
          district: a.district,
          area: a.area,
          addressLine: a.addressLine,
          isDefault: a.isDefault,
        }))}
      />
    </div>
  );
}
