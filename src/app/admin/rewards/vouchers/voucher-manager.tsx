"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Loader2, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveVoucherAction, deleteVoucherAction } from "@/actions/admin-rewards";
import { formatTk } from "@/lib/utils/currency";

type Voucher = {
  id: string;
  name: string;
  type: "FIXED_AMOUNT" | "PERCENTAGE";
  value: number;
  coinCost: number;
  minOrderValue: number;
  validDays: number;
  isActive: boolean;
  redeemedCount: number;
};

export function VoucherManager({ vouchers }: { vouchers: Voucher[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(vouchers.length === 0);

  const [form, setForm] = useState({
    name: "",
    type: "FIXED_AMOUNT" as "FIXED_AMOUNT" | "PERCENTAGE",
    value: "",
    coinCost: "",
    minOrderValue: "0",
    validDays: "30",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveVoucherAction({
        name: form.name,
        type: form.type,
        value: form.value,
        coinCost: form.coinCost,
        minOrderValue: form.minOrderValue,
        validDays: form.validDays,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Voucher template created" });
      setForm({ name: "", type: "FIXED_AMOUNT", value: "", coinCost: "", minOrderValue: "0", validDays: "30" });
      setShowForm(false);
      router.refresh();
    });
  }

  async function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await saveVoucherAction({ id, isActive: !isActive });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deactivate voucher "${name}"? Customers won't be able to redeem it anymore.`)) return;
    startTransition(async () => {
      const result = await deleteVoucherAction(id);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Voucher deactivated" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Voucher Templates</h2>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Voucher
          </Button>
        )}
      </div>

      {vouchers.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <Ticket className="mx-auto h-8 w-8 mb-2" />
            No voucher templates yet. Customers need vouchers to redeem their coins.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {vouchers.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{v.name}</span>
                    <Badge variant={v.isActive ? "default" : "secondary"}>
                      {v.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v.type === "FIXED_AMOUNT"
                      ? `${formatTk(v.value)} off`
                      : `${v.value}% off`}{" "}
                    • Costs <span className="font-semibold text-amber-600">{v.coinCost.toLocaleString()} coins</span>
                    {v.minOrderValue > 0 && ` • Min tk ${v.minOrderValue}`}
                    {` • Valid ${v.validDays} days`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {v.redeemedCount} customer{v.redeemedCount === 1 ? "" : "s"} redeemed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={v.isActive}
                    onCheckedChange={() => handleToggle(v.id, v.isActive)}
                    disabled={pending}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(v.id, v.name)}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Voucher Template</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="vname">Name *</Label>
                <Input
                  id="vname"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. tk 100 OFF"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vtype">Discount Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount (tk)</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vvalue">Value *</Label>
                  <Input
                    id="vvalue"
                    type="number"
                    step="0.01"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === "FIXED_AMOUNT" ? "100" : "10"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="vcost">Coin Cost *</Label>
                  <Input
                    id="vcost"
                    type="number"
                    required
                    value={form.coinCost}
                    onChange={(e) => setForm({ ...form, coinCost: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="vmin">Min Order (tk)</Label>
                  <Input
                    id="vmin"
                    type="number"
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="vdays">Valid Days</Label>
                  <Input
                    id="vdays"
                    type="number"
                    value={form.validDays}
                    onChange={(e) => setForm({ ...form, validDays: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Save Voucher
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
