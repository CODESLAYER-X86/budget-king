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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/delivery-zones", label: "Delivery Zones", icon: Truck },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/rewards", label: "Rewards", icon: Coins },
  { href: "/admin/groups", label: "Groups", icon: UsersRound },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/size-guides", label: "Size Guides", icon: Ruler },
  { href: "/admin/banners", label: "Banners", icon: Megaphone },
  { href: "/admin/referrals", label: "Referrals", icon: Gift },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Crown className="h-6 w-6 text-sidebar-primary" />
        <div>
          <p className="font-bold text-sm">Budget King</p>
          <p className="text-xs text-sidebar-foreground/60">{role} Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {adminNav.map((item) => {
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
