"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveDeliveryZoneAction } from "@/actions/delivery-zones";
import type { DeliveryZone } from "@prisma/client";

type ZoneRow = DeliveryZone & { _count: { orders: number } };

export function DeliveryZoneManager({ zones }: { zones: ZoneRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [charge, setCharge] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("2");
  const [divisions, setDivisions] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveDeliveryZoneAction({
        name,
        charge,
        estimatedDays,
        divisions: divisions.split(",").map((d) => d.trim()).filter(Boolean),
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Zone created" });
      setName(""); setCharge(""); setEstimatedDays("2"); setDivisions("");
      router.refresh();
    });
  }

  async function toggleActive(id: string, current: boolean) {
    startTransition(async () => {
      const result = await saveDeliveryZoneAction({
        id,
        isActive: !current,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured Zones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No delivery zones configured. Checkout won&apos;t work until at least one zone exists.
            </p>
          ) : (
            zones.map((z) => (
              <div
                key={z.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium text-sm">{z.name}</p>
                  <p className="text-xs text-muted-foreground">
                    tk {Number(z.charge)} • {z.estimatedDays} day{z.estimatedDays === 1 ? "" : "s"}
                    {z.divisions.length > 0 && ` • ${z.divisions.join(", ")}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{z._count.orders} orders</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={z.isActive ? "default" : "secondary"}>
                    {z.isActive ? "Active" : "Hidden"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(z.id, z.isActive)}
                    disabled={pending}
                  >
                    {z.isActive ? "Hide" : "Activate"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="zname">Name *</Label>
              <Input
                id="zname"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Inside Dhaka"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="zcharge">Charge (tk) *</Label>
                <Input
                  id="zcharge"
                  type="number"
                  step="0.01"
                  required
                  value={charge}
                  onChange={(e) => setCharge(e.target.value)}
                  placeholder="80"
                />
              </div>
              <div>
                <Label htmlFor="zdays">Est. Days *</Label>
                <Input
                  id="zdays"
                  type="number"
                  required
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  placeholder="2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zdiv">Divisions (comma-separated)</Label>
              <Input
                id="zdiv"
                value={divisions}
                onChange={(e) => setDivisions(e.target.value)}
                placeholder="Dhaka, Chittagong"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to apply nationwide.
              </p>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Zone
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
