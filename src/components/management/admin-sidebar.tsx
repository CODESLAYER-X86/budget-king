"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  Settings,
  Crown,
  ClipboardList,
  Star,
  Coins,
  UsersRound,
  BarChart3,
  FileText,
  Ruler,
  Megaphone,
  Gift,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  agentVisible?: boolean;
};

const allNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, agentVisible: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, agentVisible: true },
  { href: "/admin/products", label: "Products", icon: Package, agentVisible: true },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/delivery-zones", label: "Delivery Zones", icon: Truck },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/groups", label: "Groups", icon: UsersRound },
  { href: "/admin/rewards", label: "Rewards Config", icon: Coins, adminOnly: true },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/size-guides", label: "Size Guides", icon: Ruler },
  { href: "/admin/banners", label: "Banners", icon: Megaphone },
  { href: "/admin/referrals", label: "Referrals", icon: Gift },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/staff", label: "Staff & Users", icon: UserCog, adminOnly: true },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";

  // Filter nav items based on role
  let nav: NavItem[];
  if (role === "AGENT") {
    // Agents only see: Dashboard + Orders + Products (view only)
    nav = allNav.filter((item) => item.agentVisible);
  } else if (role === "MODERATOR") {
    // Moderators see everything except admin-only items
    nav = allNav.filter((item) => !item.adminOnly);
  } else {
    // Admin sees everything
    nav = allNav;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Crown className="h-6 w-6 text-sidebar-primary" />
        <div>
          <p className="font-bold text-sm">Budget King</p>
          <p className="text-xs text-sidebar-foreground/60">{role} Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto bk-scroll">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link href="/" className="block">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            ← Back to Store
          </Button>
        </Link>
      </div>
    </aside>
  );
}
