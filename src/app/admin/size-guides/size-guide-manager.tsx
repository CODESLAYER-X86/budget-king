"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveSizeGuideAction } from "@/actions/size-guides";

type Guide = {
  categoryId: string;
  categoryName: string;
  title: string;
  rows: Array<Record<string, string>>;
  notes: string | null;
};

export function SizeGuideManager({
  categories,
  guides,
}: {
  categories: Array<{ id: string; name: string }>;
  guides: Guide[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    guides[0]?.categoryId ?? categories[0]?.id ?? ""
  );

  const existing = guides.find((g) => g.categoryId === selectedCategoryId);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [rows, setRows] = useState<Array<Record<string, string>>>(
    existing?.rows ?? [{ size: "", chest: "", length: "", shoulder: "" }]
  );
  const [columns, setColumns] = useState<string[]>(
    existing?.rows[0] ? Object.keys(existing.rows[0]) : ["size", "chest", "length", "shoulder"]
  );

  function selectCategory(catId: string) {
    setSelectedCategoryId(catId);
    const g = guides.find((x) => x.categoryId === catId);
    setTitle(g?.title ?? "");
    setNotes(g?.notes ?? "");
    setRows(g?.rows ?? [{ size: "", chest: "", length: "", shoulder: "" }]);
    setColumns(g?.rows[0] ? Object.keys(g.rows[0]) : ["size", "chest", "length", "shoulder"]);
  }

  function addRow() {
    const newRow: Record<string, string> = {};
    columns.forEach((c) => (newRow[c] = ""));
    setRows([...rows, newRow]);
  }

  function removeRow(idx: number) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  function updateCell(idx: number, col: string, value: string) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, [col]: value } : r)));
  }

  function addColumn() {
    const name = prompt("Column name (e.g. waist):");
    if (!name) return;
    setColumns([...columns, name]);
    setRows(rows.map((r) => ({ ...r, [name]: "" })));
  }

  function removeColumn(col: string) {
    setColumns(columns.filter((c) => c !== col));
    setRows(rows.map((r) => {
      const { [col]: _, ...rest } = r;
      return rest;
    }));
  }

  async function handleSave() {
    startTransition(async () => {
      const result = await saveSizeGuideAction({
        categoryId: selectedCategoryId,
        title,
        rows,
        notes: notes || undefined,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Size guide saved" });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      {/* Categories list */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground mb-2">Categories</p>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCategory(c.id)}
            className={`block w-full text-left rounded-md px-3 py-1.5 text-sm hover:bg-accent ${
              selectedCategoryId === c.id ? "bg-accent font-medium" : ""
            }`}
          >
            {c.name}
            {guides.find((g) => g.categoryId === c.id) && (
              <span className="ml-1 text-green-600">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {categories.find((c) => c.id === selectedCategoryId)?.name ?? "—"} Size Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="title" className="text-xs">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Shirt Size Chart"
            />
          </div>

          {/* Size chart table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-secondary">
                  {columns.map((col) => (
                    <th key={col} className="p-2 text-left border relative">
                      <span className="capitalize">{col}</span>
                      <button
                        onClick={() => removeColumn(col)}
                        className="absolute right-1 top-1 text-destructive hover:underline"
                        title="Remove column"
                      >
                        ×
                      </button>
                    </th>
                  ))}
                  <th className="p-2 border w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={col} className="p-1 border">
                        <input
                          type="text"
                          value={row[col] ?? ""}
                          onChange={(e) => updateCell(idx, col, e.target.value)}
                          className="w-full px-2 py-1 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary rounded"
                        />
                      </td>
                    ))}
                    <td className="p-1 border text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="text-destructive hover:underline"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1 h-3 w-3" /> Add Row
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addColumn}>
              <Plus className="mr-1 h-3 w-3" /> Add Column
            </Button>
          </div>

          <div>
            <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How to measure, sizing tips, etc."
            />
          </div>

          <Button onClick={handleSave} disabled={pending}>
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Save Size Guide
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
