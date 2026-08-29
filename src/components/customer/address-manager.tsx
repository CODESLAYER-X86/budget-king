"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveAddressAction, deleteAddressAction } from "@/actions/addresses";

type AddressRow = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area: string | null;
  addressLine: string;
  isDefault: boolean;
};

export function AddressManager({ addresses }: { addresses: AddressRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(addresses.length === 0);

  const [form, setForm] = useState({
    label: "",
    fullName: "",
    phone: "",
    division: "",
    district: "",
    area: "",
    addressLine: "",
    isDefault: addresses.length === 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveAddressAction({
        label: form.label || undefined,
        fullName: form.fullName,
        phone: form.phone,
        division: form.division,
        district: form.district,
        area: form.area || undefined,
        addressLine: form.addressLine,
        isDefault: form.isDefault,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Address saved" });
      setForm({
        label: "", fullName: "", phone: "", division: "",
        district: "", area: "", addressLine: "", isDefault: false,
      });
      setShowForm(false);
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Address deleted" });
      router.refresh();
    });
  }

  async function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await saveAddressAction({ id, isDefault: true });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Saved Addresses</h2>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add New
          </Button>
        )}
      </div>

      {addresses.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <MapPin className="mx-auto h-8 w-8 mb-2" />
            No saved addresses yet. Add your first delivery address.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {addresses.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{a.label ?? "Address"}</span>
                    {a.isDefault && <Badge className="text-xs">Default</Badge>}
                  </div>
                  <p className="mt-1 text-sm">{a.fullName} • {a.phone}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.addressLine}</p>
                  <p className="text-xs text-muted-foreground">
                    {[a.area, a.district, a.division].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {!a.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSetDefault(a.id)}
                      disabled={pending}
                      className="text-xs"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(a.id)}
                    disabled={pending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
            <CardTitle className="text-base">Add New Address</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="label" className="text-xs">Label (optional)</Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Home, Office..."
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">Phone *</Label>
                <Input
                  id="phone"
                  required
                  pattern="01[0-9]{9}"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="h-9"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="fullName" className="text-xs">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="division" className="text-xs">Division *</Label>
                <Input
                  id="division"
                  required
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                  placeholder="Dhaka"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="district" className="text-xs">District *</Label>
                <Input
                  id="district"
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="Dhaka"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="area" className="text-xs">Area</Label>
                <Input
                  id="area"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Mirpur 10"
                  className="h-9"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="addressLine" className="text-xs">Full Address *</Label>
                <Input
                  id="addressLine"
                  required
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  placeholder="House, road, building..."
                  className="h-9"
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Set as default address
              </label>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Save Address
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
