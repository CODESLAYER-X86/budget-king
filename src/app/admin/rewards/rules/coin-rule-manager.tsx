"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Loader2, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveCoinRuleAction, deleteCoinRuleAction } from "@/actions/admin-rewards";

type Rule = {
  id: string;
  name: string;
  minPurchase: number;
  coinsAwarded: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export function CoinRuleManager({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(rules.length === 0);

  const [form, setForm] = useState({
    name: "",
    minPurchase: "",
    coinsAwarded: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveCoinRuleAction({
        name: form.name,
        minPurchase: form.minPurchase,
        coinsAwarded: form.coinsAwarded,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Rule created" });
      setForm({ name: "", minPurchase: "", coinsAwarded: "" });
      setShowForm(false);
      router.refresh();
    });
  }

  async function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await saveCoinRuleAction({ id, isActive: !isActive });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete rule "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCoinRuleAction(id);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Rule deleted" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Configured Rules</h2>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Rule
          </Button>
        )}
      </div>

      {rules.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <Coins className="mx-auto h-8 w-8 mb-2" />
            No coin rules yet. Customers won&apos;t earn coins on delivery until you add a rule.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{r.name}</span>
                    <Badge variant={r.isActive ? "default" : "secondary"}>
                      {r.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Spend tk {r.minPurchase.toLocaleString()}+ → earn{" "}
                    <span className="font-semibold text-amber-600">{r.coinsAwarded.toLocaleString()} coins</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={r.isActive}
                    onCheckedChange={() => handleToggle(r.id, r.isActive)}
                    disabled={pending}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(r.id, r.name)}
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
            <CardTitle className="text-base">New Coin Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="rname">Rule Name *</Label>
                <Input
                  id="rname"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Standard Reward"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rmin">Minimum Purchase (tk) *</Label>
                  <Input
                    id="rmin"
                    type="number"
                    step="0.01"
                    required
                    value={form.minPurchase}
                    onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="rcoins">Coins Awarded *</Label>
                  <Input
                    id="rcoins"
                    type="number"
                    required
                    value={form.coinsAwarded}
                    onChange={(e) => setForm({ ...form, coinsAwarded: e.target.value })}
                    placeholder="2000"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                When an order is delivered and the merchandise subtotal ≥ minimum purchase,
                the customer earns the specified coins. The highest matching rule wins.
              </p>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Save Rule
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
