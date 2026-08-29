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
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveBannerAction, deleteBannerAction } from "@/actions/banners";

type Banner = {
  id: string;
  title: string;
  message: string;
  ctaText: string | null;
  ctaLink: string | null;
  bgColor: string;
  textColor: string;
  placement: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(banners.length === 0);

  const [form, setForm] = useState({
    title: "",
    message: "",
    ctaText: "",
    ctaLink: "",
    bgColor: "#d4a017",
    textColor: "#ffffff",
    placement: "top",
    startsAt: "",
    endsAt: "",
    isActive: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveBannerAction({
        ...form,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
        ctaText: form.ctaText || undefined,
        ctaLink: form.ctaLink || undefined,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Banner saved" });
      setForm({
        title: "", message: "", ctaText: "", ctaLink: "",
        bgColor: "#d4a017", textColor: "#ffffff", placement: "top",
        startsAt: "", endsAt: "", isActive: true,
      });
      setShowForm(false);
      router.refresh();
    });
  }

  async function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const b = banners.find((x) => x.id === id);
      if (!b) return;
      const result = await saveBannerAction({ ...b, isActive: !isActive });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return;
    startTransition(async () => {
      const result = await deleteBannerAction(id);
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Banner deleted" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">All Banners</h2>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Banner
          </Button>
        )}
      </div>

      {banners.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No banners yet. Add a promotional banner to display at the top of every page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {banners.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{b.title}</span>
                    <Badge variant="outline">{b.placement}</Badge>
                    {b.isActive ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  {/* Preview */}
                  <div
                    className="mt-2 rounded-md p-3 text-sm"
                    style={{ backgroundColor: b.bgColor, color: b.textColor }}
                  >
                    <span>{b.message}</span>
                    {b.ctaText && (
                      <span className="ml-2 underline font-medium">{b.ctaText} →</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {b.startsAt && `From ${new Date(b.startsAt).toLocaleDateString("en-BD")} `}
                    {b.endsAt && `until ${new Date(b.endsAt).toLocaleDateString("en-BD")}`}
                    {!b.startsAt && !b.endsAt && "No schedule (always shown when active)"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={b.isActive}
                    onCheckedChange={() => handleToggle(b.id, b.isActive)}
                    disabled={pending}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(b.id)}
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
            <CardTitle className="text-base">New Banner</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="btitle" className="text-xs">Title (internal) *</Label>
                <Input
                  id="btitle" required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Eid Sale 2026"
                />
              </div>
              <div>
                <Label className="text-xs">Placement</Label>
                <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top (above navbar)</SelectItem>
                    <SelectItem value="below_hero">Below hero</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bmsg" className="text-xs">Message *</Label>
                <Input
                  id="bmsg" required value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Get 20% off all shirts this Eid!"
                />
              </div>
              <div>
                <Label htmlFor="bctatext" className="text-xs">CTA Text</Label>
                <Input
                  id="bctatext" value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
              <div>
                <Label htmlFor="bctalink" className="text-xs">CTA Link</Label>
                <Input
                  id="bctalink" value={form.ctaLink}
                  onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                  placeholder="/offers"
                />
              </div>
              <div>
                <Label htmlFor="bbg" className="text-xs">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.bgColor}
                    onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                    className="h-9 w-12 rounded border"
                  />
                  <Input
                    value={form.bgColor}
                    onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="btext" className="text-xs">Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.textColor}
                    onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                    className="h-9 w-12 rounded border"
                  />
                  <Input
                    value={form.textColor}
                    onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bstart" className="text-xs">Starts At</Label>
                <Input
                  id="bstart" type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bend" className="text-xs">Ends At</Label>
                <Input
                  id="bend" type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  Save Banner
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
