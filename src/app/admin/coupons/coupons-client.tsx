"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  Percent,
  Coins,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { formatTk } from "@/lib/utils/currency";
import {
  createCouponAction,
  updateCouponAction,
  toggleCouponActiveAction,
  deleteCouponAction,
} from "@/actions/coupons";

export type CouponItem = {
  id: string;
  code: string;
  description: string | null;
  type: "FIXED_AMOUNT" | "PERCENTAGE";
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
  totalUsageLimit: number | null;
  perUserLimit: number;
  usedCount: number;
  actualUsagesCount: number;
  startDate: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export function CouponsClient({ coupons }: { coupons: CouponItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"FIXED_AMOUNT" | "PERCENTAGE">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [totalUsageLimit, setTotalUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  function openCreateDialog() {
    setEditingCoupon(null);
    setCode("");
    setDescription("");
    setType("PERCENTAGE");
    setValue("");
    setMaxDiscount("");
    setMinOrderValue("0");
    setTotalUsageLimit("");
    setPerUserLimit("1");
    setExpiresAt("");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEditDialog(c: CouponItem) {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || "");
    setType(c.type);
    setValue(c.value.toString());
    setMaxDiscount(c.maxDiscount ? c.maxDiscount.toString() : "");
    setMinOrderValue(c.minOrderValue.toString());
    setTotalUsageLimit(c.totalUsageLimit ? c.totalUsageLimit.toString() : "");
    setPerUserLimit(c.perUserLimit.toString());
    setExpiresAt(c.expiresAt ? c.expiresAt.split("T")[0] : "");
    setIsActive(c.isActive);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !value || Number(value) <= 0) {
      toast({ title: "Validation error", description: "Please enter a valid code and value", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        type,
        value: Number(value),
        maxDiscount: type === "PERCENTAGE" && maxDiscount ? Number(maxDiscount) : undefined,
        minOrderValue: Number(minOrderValue) || 0,
        totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : undefined,
        perUserLimit: Number(perUserLimit) || 1,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59Z`).toISOString() : undefined,
        isActive,
      };

      let result;
      if (editingCoupon) {
        result = await updateCouponAction({ ...payload, id: editingCoupon.id });
      } else {
        result = await createCouponAction(payload);
      }

      if (!result.ok) {
        toast({ title: "Operation failed", description: result.error, variant: "destructive" });
        return;
      }

      toast({
        title: editingCoupon ? "Coupon updated" : "Coupon created",
        description: `Promo code ${payload.code} is ready.`,
      });
      setDialogOpen(false);
      router.refresh();
    });
  }

  function handleToggleActive(id: string) {
    startTransition(async () => {
      const result = await toggleCouponActiveAction(id);
      if (!result.ok) {
        toast({ title: "Toggle failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Coupon status changed." });
      router.refresh();
    });
  }

  function handleDelete(id: string, codeName: string) {
    if (!confirm(`Are you sure you want to delete promo code "${codeName}"?`)) return;

    startTransition(async () => {
      const result = await deleteCouponAction(id);
      if (!result.ok) {
        toast({ title: "Delete failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Deleted", description: `Promo code ${codeName} removed.` });
      router.refresh();
    });
  }

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalUsages = coupons.reduce((acc, c) => acc + c.usedCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" /> Promo Codes & Coupons
          </h1>
          <p className="text-sm text-muted-foreground">
            Create public promotional discount codes (e.g. EID50, WELCOME100).
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Create Promo Code
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coupons.length}</p>
              <p className="text-xs text-muted-foreground">Total Coupons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-green-500/10 p-3 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Promo Codes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUsages}</p>
              <p className="text-xs text-muted-foreground">Total Redemptions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base">All Promo Codes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {coupons.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-3 text-sm font-semibold">No promo codes yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Create your first promotional discount code like EID50.
              </p>
              <Button onClick={openCreateDialog} size="sm" className="mt-4 gap-1.5">
                <Plus className="h-4 w-4" /> Create Code
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code & Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usages</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => {
                  const isExpired = c.expiresAt && new Date(c.expiresAt) <= new Date();
                  const isLimitReached = c.totalUsageLimit !== null && c.usedCount >= c.totalUsageLimit;

                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-secondary px-2 py-1 rounded">
                            {c.code}
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {c.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-semibold">
                          {c.type === "FIXED_AMOUNT" ? formatTk(c.value) : `${c.value}% OFF`}
                        </Badge>
                        {c.type === "PERCENTAGE" && c.maxDiscount && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Max: {formatTk(c.maxDiscount)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.minOrderValue > 0 ? formatTk(c.minOrderValue) : "No min"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{c.usedCount}</span>
                        <span className="text-muted-foreground">
                          {c.totalUsageLimit ? ` / ${c.totalUsageLimit}` : " / ∞"}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          ({c.perUserLimit}x per user)
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.expiresAt ? (
                          <span className={isExpired ? "text-destructive font-medium" : ""}>
                            {new Date(c.expiresAt).toLocaleDateString("en-BD", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          "Never"
                        )}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : isLimitReached ? (
                          <Badge variant="secondary">Limit Reached</Badge>
                        ) : c.isActive ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Switch
                            checked={c.isActive}
                            onCheckedChange={() => handleToggleActive(c.id)}
                            disabled={pending}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(c)}
                            disabled={pending}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(c.id, c.code)}
                            disabled={pending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? `Edit Promo Code (${editingCoupon.code})` : "Create New Promo Code"}
              </DialogTitle>
              <DialogDescription>
                Configure public promotional discount parameters.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs">
                    Promo Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. EID50"
                    required
                    className="font-mono uppercase text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs">
                    Discount Type
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(val: "FIXED_AMOUNT" | "PERCENTAGE") => setType(val)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="value" className="text-xs">
                    {type === "PERCENTAGE" ? "Discount Percentage (%)" : "Discount Amount (৳)"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="1"
                    step="any"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === "PERCENTAGE" ? "e.g. 50" : "e.g. 100"}
                    required
                  />
                </div>
                {type === "PERCENTAGE" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="maxDiscount" className="text-xs">
                      Max Discount Cap (৳) <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="1"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="e.g. 200"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">
                  Description <span className="text-muted-foreground">(Customer visible)</span>
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Eid-ul-Fitr 50% Mega Discount"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minOrder" className="text-xs">
                    Min Order (৳)
                  </Label>
                  <Input
                    id="minOrder"
                    type="number"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="totalLimit" className="text-xs">
                    Store Limit
                  </Label>
                  <Input
                    id="totalLimit"
                    type="number"
                    min="1"
                    value={totalUsageLimit}
                    onChange={(e) => setTotalUsageLimit(e.target.value)}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="perUserLimit" className="text-xs">
                    Per User
                  </Label>
                  <Input
                    id="perUserLimit"
                    type="number"
                    min="1"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    placeholder="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiresAt" className="text-xs">
                  Expiration Date <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-xs font-semibold">
                    Enable Coupon
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Inactive coupons cannot be applied at checkout.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingCoupon ? "Save Changes" : "Create Code"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
