"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignOrderAgentAction } from "@/actions/orders";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StaffAgent = {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
};

export function AssignAgentSelector({
  orderId,
  currentAgentId,
  agents,
}: {
  orderId: string;
  currentAgentId: string | null;
  agents: StaffAgent[];
}) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentAgentId ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const assignedAgent = agents.find((a) => a.id === (currentAgentId ?? ""));

  function handleChange(newAgentId: string) {
    setSelectedAgentId(newAgentId);
    startTransition(async () => {
      const result = await assignOrderAgentAction({
        orderId,
        agentId: newAgentId ? newAgentId : null,
      });

      if (!result.ok) {
        toast({
          title: "Assignment failed",
          description: result.error,
          variant: "destructive",
        });
        setSelectedAgentId(currentAgentId ?? "");
        return;
      }

      toast({
        title: "Agent Assigned",
        description: newAgentId
          ? `Order assigned to ${agents.find((a) => a.id === newAgentId)?.fullName ?? "Staff"}`
          : "Order unassigned",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {assignedAgent ? (
        <div className="flex items-center justify-between gap-2 pb-1">
          <div>
            <p className="font-medium text-sm text-foreground">
              {assignedAgent.fullName ?? assignedAgent.email}
            </p>
            <p className="text-xs text-muted-foreground">{assignedAgent.email}</p>
          </div>
          <Badge variant={assignedAgent.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
            {assignedAgent.role}
          </Badge>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic pb-1">
          No agent assigned yet. (Will auto-assign when an agent confirms)
        </p>
      )}

      <div className="relative">
        <select
          value={selectedAgentId}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        >
          <option value="">— Select Agent to Assign —</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.fullName ? `${agent.fullName} (${agent.role})` : `${agent.email} (${agent.role})`}
            </option>
          ))}
        </select>
        {pending && (
          <div className="absolute right-2 top-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
