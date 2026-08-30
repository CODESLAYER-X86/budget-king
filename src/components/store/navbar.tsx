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

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/offers", label: "Offers" },
  { href: "/groups", label: "Groups" },
  { href: "/blog", label: "Blog" },
  { href: "/track", label: "Track Order" },
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
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Budget King BD
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium hover:bg-accent ${
                    pathname === l.href ? "bg-accent" : ""
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <form onSubmit={onSearch} className="mt-2 px-3">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products"
                  className="w-full"
                />
              </form>
              <div className="mt-4 border-t pt-4">
                {authUser ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                      <User className="h-4 w-4" /> My Account
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    <Link
                      href="/rewards"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                      <User className="h-4 w-4" /> Rewards
                    </Link>
                    <Link
                      href="/auth/signout"
                      onClick={() => setMobileOpen(false)}
                      className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-accent"
                    >
                      <User className="h-4 w-4" /> Sign Out
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
                  >
                    Sign in with Google
                  </Link>
                )}
                {authUser && (authUser.role === "ADMIN" || authUser.role === "AGENT" || authUser.role === "MODERATOR") && (
                  <Link
                    href={`/${authUser.role.toLowerCase()}`}
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    <Package className="h-4 w-4" /> {authUser.role} Dashboard
                  </Link>
                )}
              </div>
            </nav>
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
          {navLinks.map((l) => (
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
