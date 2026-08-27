import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure store-wide settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Store Name</span>
            <span className="font-medium">Budget King BD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Currency</span>
            <Badge>tk (Bangladeshi Taka)</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method</span>
            <Badge>Cash on Delivery only</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming in Future Phases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Rewards configuration (Phase 5) — coin earning rules, voucher tiers</p>
          <p>• Group shopping rules (Phase 6) — max members, group delivery</p>
          <p>• Email/notification settings (Phase 8)</p>
          <p>• SEO and homepage editor (Phase 4)</p>
        </CardContent>
      </Card>
    </div>
  );
}
