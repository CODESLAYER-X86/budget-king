"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { shareProductToGroupAction, getMyGroups } from "@/actions/groups";
import { useEffect } from "react";

type Group = {
  id: string;
  name: string;
  role: string;
};

export function ShareToGroupButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [shared, setShared] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      getMyGroups().then((g) => {
        setGroups(g.map((x) => ({ id: x.id, name: x.name, role: x.role })));
      });
    }
  }, [open]);

  async function handleShare() {
    if (!selectedGroup) return;
    startTransition(async () => {
      const result = await shareProductToGroupAction({
        groupId: selectedGroup,
        productId,
        note: note || undefined,
      });
      if (!result.ok) {
        toast({ title: "Failed", description: result.error, variant: "destructive" });
        return;
      }
      setShared(selectedGroup);
      toast({ title: "Shared to group!" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setShared(null); setNote(""); setSelectedGroup(null); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-1 h-4 w-4" /> Share to Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share to a Group</DialogTitle>
        </DialogHeader>
        {shared ? (
          <div className="text-center py-6">
            <Check className="mx-auto h-12 w-12 text-green-600 mb-3" />
            <p className="font-medium">Shared successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Members can vote and add it to the group cart.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-6">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              You haven&apos;t joined any groups yet.
            </p>
            <Button className="mt-3" variant="outline" onClick={() => setOpen(false)}>
              Create a group first
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Choose a group:</p>
              {groups.map((g) => (
                <label
                  key={g.id}
                  className={`flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-accent ${
                    selectedGroup === g.id ? "border-primary bg-accent" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.role}</p>
                  </div>
                  <input
                    type="radio"
                    name="group"
                    checked={selectedGroup === g.id}
                    onChange={() => setSelectedGroup(g.id)}
                  />
                </label>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Note (optional):</p>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What do you think of this?"
                maxLength={280}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleShare}
              disabled={!selectedGroup || pending}
            >
              {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Share to Group
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
