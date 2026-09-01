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
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://wa.me/8801602316968"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0" /> +880 1602-316968 (WhatsApp)
                </a>
              </li>
              <li>
                <a
                  href="mailto:budget.king.86@gmail.com"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0" /> budget.king.86@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61593587947120"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook Page
                </a>
              </li>
              <li className="flex items-center gap-2 text-xs">
                <MapPin className="h-4 w-4 shrink-0" /> Dhaka, Bangladesh
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <p>
            Designed and Created by{" "}
            <a
              href="https://www.linkedin.com/in/codeslayer-x86/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors underline underline-offset-2"
            >
              CODESLAYER_X86
            </a>
          </p>
          <div className="flex gap-4">
            <Link href="/info/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/info/terms" className="hover:text-primary">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
