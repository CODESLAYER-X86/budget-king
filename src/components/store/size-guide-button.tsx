"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ruler } from "lucide-react";

type SizeGuideData = {
  title: string;
  rows: Array<Record<string, string>>;
  notes: string | null;
};

export function SizeGuideButton({ guide }: { guide: SizeGuideData | null }) {
  const [open, setOpen] = useState(false);

  if (!guide) return null;

  const columns = guide.rows[0] ? Object.keys(guide.rows[0]) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Ruler className="mr-1 h-4 w-4" /> Size Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{guide.title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-secondary">
                {columns.map((col) => (
                  <th key={col} className="p-2 text-left border capitalize">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  {columns.map((col) => (
                    <td key={col} className="p-2 border">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {guide.notes && (
          <div className="mt-3 text-xs text-muted-foreground whitespace-pre-line">
            {guide.notes}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
