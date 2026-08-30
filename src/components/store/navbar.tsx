"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Package,
  Home,
  Users,
  BookOpen,
  Truck,
  Coins,
  MapPin,
  LogOut,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-store";
import { CartDrawer } from "@/components/store/cart-drawer";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/auth/use-auth-user";

// Desktop top nav (includes Shop and Offers)
const desktopNavLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/offers", label: "Offers" },
  { href: "/groups", label: "Groups" },
  { href: "/blog", label: "Blog" },
  { href: "/track", label: "Track Order" },
];

// Mobile drawer nav (Per user request: Shop and Offers omitted as they are in the bottom bar)
const mobileNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/track", label: "Track Order", icon: Truck },
];

export function StoreNavbar() {
  // Client-side auth check — works with ISR cached pages
  const authUser = useAuthUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const cartOpen = useCart((s) => s.isOpen);
  const setCartOpen = useCart((s) => s.setOpen);
  const localCartCount = useCart((s) => s.count());
  const router = useRouter();

  const totalCart = localCartCount;

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
      setMobileOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden active:scale-90 transition-transform"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0 flex flex-col justify-between">
            <div className="overflow-y-auto p-5 space-y-5">
              <SheetHeader className="text-left border-b pb-4">
                <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                  <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    <Crown className="h-5 w-5" />
                  </div>
                  <span>Budget King BD</span>
                </SheetTitle>
              </SheetHeader>

              {/* Search Bar */}
              <form onSubmit={onSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9 h-10 rounded-xl bg-secondary/40 border-border/80 focus:bg-background transition-colors"
                />
              </form>

              {/* User Greeting Card if logged in */}
              {authUser ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                    {authUser.fullName ? authUser.fullName.slice(0, 2).toUpperCase() : "BK"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {authUser.fullName || "Valued Customer"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{authUser.email}</p>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 active:scale-[0.98] transition-transform"
                >
                  Sign in with Google
                </Link>
              )}

              {/* Main Store Links (Home, Groups, Blog, Track Order) */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                  Explore
                </p>
                {mobileNavLinks.map((l) => {
                  const Icon = l.icon;
                  const isActive = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      {l.label}
                    </Link>
                  );
                })}
              </div>

              {/* Customer Account Links (if logged in) */}
              {authUser && (
                <div className="space-y-1 border-t pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                    My Account
                  </p>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary active:scale-[0.98]"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Overview
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary active:scale-[0.98]"
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    My Orders
                  </Link>
                  <Link
                    href="/rewards"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <Coins className="h-4 w-4 text-amber-500" />
                      Budget Coins
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Rewards
                    </span>
                  </Link>
                  <Link
                    href="/addresses"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary active:scale-[0.98]"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Saved Addresses
                  </Link>

                  {/* Staff Portal Link */}
                  {(authUser.role === "ADMIN" || authUser.role === "AGENT" || authUser.role === "MODERATOR") && (
                    <Link
                      href={`/${authUser.role.toLowerCase()}`}
                      onClick={() => setMobileOpen(false)}
                      className="mt-2 flex items-center gap-3 rounded-xl bg-secondary/80 px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      <Shield className="h-4 w-4 text-primary" />
                      {authUser.role} Control Panel
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Drawer Footer with Styled Sign Out */}
            {authUser && (
              <div className="border-t p-4 bg-muted/20">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem("bk_auth_user");
                    } catch {}
                    setMobileOpen(false);
                    window.location.href = "/auth/signout";
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20 active:scale-[0.98] transition-all"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Budget King BD" className="h-8 w-8 rounded-full" />
          <span className="hidden text-lg font-bold tracking-tight sm:inline">
            Budget King <span className="text-primary">BD</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {desktopNavLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors ${
                pathname === l.href
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search (desktop) */}
        <form onSubmit={onSearch} className="ml-auto hidden md:flex items-center max-w-sm flex-1">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shirts, categories..."
              className="pl-9 w-full"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1 md:ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
            className="relative"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalCart > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {totalCart > 99 ? "99+" : totalCart}
              </span>
            )}
          </Button>

          {authUser ? (
            <>
              {authUser.role === "ADMIN" || authUser.role === "AGENT" || authUser.role === "MODERATOR" ? (
                <div className="hidden md:flex items-center gap-1">
                  <Link
                    href={`/${authUser.role.toLowerCase()}`}
                    className="px-3 py-2 text-sm font-medium rounded-md bg-secondary hover:bg-accent flex items-center gap-1"
                  >
                    <Package className="h-4 w-4" /> Dashboard
                  </Link>
                </div>
              ) : null}
              <div className="hidden md:flex items-center gap-1">
                <Link href="/orders" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent">Orders</Link>
                <Link href="/rewards" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent">Rewards</Link>
              </div>
              <Link href="/account">
                <Button variant="ghost" size="icon" aria-label="My account">
                  {authUser.fullName ? authUser.fullName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
