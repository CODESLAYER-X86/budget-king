import Link from "next/link";
import { Crown, Mail, Phone, MapPin } from "lucide-react";

export function StoreFooter() {
  return (
    <footer className="mt-auto border-t bg-secondary/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Budget King BD" className="h-8 w-8 rounded-full" />
              <span className="text-lg font-bold">
                Budget King <span className="text-primary">BD</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Quality clothing that fits your budget. Cash on Delivery
              everywhere in Bangladesh.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shop" className="hover:text-primary">All Products</Link></li>
              <li><Link href="/category/shirts" className="hover:text-primary">Shirts</Link></li>
              <li><Link href="/track" className="hover:text-primary">Track Order</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/info/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/info/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link href="/info/shipping" className="hover:text-primary">Shipping &amp; Delivery</Link></li>
              <li><Link href="/info/returns" className="hover:text-primary">Returns &amp; Exchanges</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">Get in Touch</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +880 1XXX-XXXXXX
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> support@budgetkingbd.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Dhaka, Bangladesh
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Budget King BD. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/info/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/info/terms" className="hover:text-primary">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
