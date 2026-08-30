"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Flame, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const cartCount = useCart((s) => s.count());
  const setCartOpen = useCart((s) => s.setOpen);
  const authUser = useAuthUser();

  // Don't show bottom bar inside admin/moderator/agent dashboards
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/moderator") ||
    pathname.startsWith("/agent")
  ) {
    return null;
  }

  const accountHref = authUser ? "/account" : "/login";
  const isAccountActive =
    pathname === "/account" ||
    pathname === "/login" ||
    pathname === "/orders" ||
    pathname === "/rewards" ||
    pathname === "/addresses";

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Shop",
      href: "/shop",
      icon: ShoppingBag,
      isActive: pathname.startsWith("/shop") || pathname.startsWith("/product"),
    },
    {
      label: "Offers",
      href: "/offers",
      icon: Flame,
      isActive: pathname === "/offers",
      badge: "HOT",
    },
    {
      label: "Cart",
      onClick: () => setCartOpen(true),
      icon: ShoppingCart,
      isActive: false,
      badgeCount: cartCount,
    },
    {
      label: authUser ? "Account" : "Sign In",
      href: accountHref,
      icon: User,
      isActive: isAccountActive,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/60 bg-background/85 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] supports-[backdrop-filter]:bg-background/75 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[56px]",
                item.isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              {/* Active Indicator Glow */}
              {item.isActive && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-primary animate-in fade-in zoom-in duration-200" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    item.isActive ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"
                  )}
                />

                {/* Hot badge for Offers */}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-3.5 flex h-3.5 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white tracking-tighter">
                    {item.badge}
                  </span>
                )}

                {/* Live Cart Count Badge */}
                {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in-50 duration-150">
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-1 text-[10px] tracking-tight truncate max-w-[52px]",
                  item.isActive ? "font-semibold text-primary" : "font-normal"
                )}
              >
                {item.label}
              </span>
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className="flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
