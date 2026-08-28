"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Crown } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import type { SessionUser } from "@/lib/auth/session";

export function AdminTopbar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Budget King BD
            </SheetTitle>
          </SheetHeader>
          <AdminSidebar role={user.profile?.role ?? "ADMIN"} />
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <h1 className="font-semibold">{user.profile?.role} Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right text-sm hidden sm:block">
          <p className="font-medium">{user.profile?.fullName ?? user.email}</p>
          <p className="text-xs text-muted-foreground">{user.profile?.role}</p>
        </div>
        <a href="/auth/signout" aria-label="Sign out">
          <Button variant="ghost" size="icon">
            <LogOut className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </header>
  );
}
