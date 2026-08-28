import { db } from "@/lib/db";
import { BannerManager } from "./banner-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await db.banner.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promotional Banners</h1>
        <p className="text-sm text-muted-foreground">
          Site-wide banners with scheduling. Top banners appear above the navbar.
        </p>
      </div>
      <BannerManager
        banners={banners.map((b) => ({
          id: b.id,
          title: b.title,
          message: b.message,
          ctaText: b.ctaText,
          ctaLink: b.ctaLink,
          bgColor: b.bgColor,
          textColor: b.textColor,
          placement: b.placement,
          startsAt: b.startsAt?.toISOString() ?? null,
          endsAt: b.endsAt?.toISOString() ?? null,
          isActive: b.isActive,
        }))}
      />
    </div>
  );
}
