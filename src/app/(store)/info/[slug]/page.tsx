import { Card, CardContent } from "@/components/ui/card";
import { Truck, RotateCcw, ShieldCheck, Phone } from "lucide-react";

const pages: Record<string, { title: string; body: React.ReactNode }> = {
  about: {
    title: "About Budget King BD",
    body: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          Budget King BD is a Bangladesh-first clothing store built around one
          belief: quality clothing should be affordable for everyone.
        </p>
        <p>
          We started with shirts because they&apos;re the most universal piece of
          clothing — and we wanted to nail the basics before expanding. Every
          product we sell is inspected for quality before it ships.
        </p>
        <p>
          What makes us different? We let customers pay with Cash on Delivery
          everywhere in Bangladesh, reward loyal customers with Budget Coins,
          and let friends shop together with Group Shopping.
        </p>
      </div>
    ),
  },
  contact: {
    title: "Contact Us",
    body: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +880 1XXX-XXXXXX</p>
        <p>support@budgetkingbd.com</p>
        <p>Dhaka, Bangladesh</p>
        <p className="text-xs pt-4">Customer support hours: 10am–8pm (Sat–Thu)</p>
      </div>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    body: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>We respect your privacy. We only collect the information necessary to process your orders — your name, phone number, and delivery address.</p>
        <p>We do not share your personal information with third parties except as required for order fulfillment (e.g., delivery agents).</p>
        <p>Your Google account email is used only for authentication and order history. We do not access your Google data beyond what Supabase Auth provides.</p>
        <p>For any privacy concerns, contact us at support@budgetkingbd.com.</p>
      </div>
    ),
  },
  terms: {
    title: "Terms & Conditions",
    body: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>By placing an order on Budget King BD, you agree to these terms:</p>
        <p><strong>Payment:</strong> All orders are Cash on Delivery (COD). You pay in cash when your order is delivered.</p>
        <p><strong>Cancellation:</strong> You can cancel orders that are in PENDING or CONFIRMED status. Once shipped, cancellation is not possible.</p>
        <p><strong>Returns:</strong> Items can be returned within 7 days of delivery if unworn and with original tags.</p>
        <p><strong>Budget Coins:</strong> Coins are awarded on delivered orders and can be redeemed for vouchers. Coins may be reversed if an order is cancelled or returned.</p>
        <p><strong>Group Orders:</strong> When participating in a group order, the group owner is responsible for the combined payment upon delivery.</p>
      </div>
    ),
  },
  shipping: {
    title: "Shipping & Delivery",
    body: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-start gap-2"><Truck className="h-4 w-4 mt-0.5 text-primary" /> <span><strong>Inside Dhaka:</strong> tk 80, estimated 1–2 days</span></p>
        <p className="flex items-start gap-2"><Truck className="h-4 w-4 mt-0.5 text-primary" /> <span><strong>Outside Dhaka:</strong> tk 120, estimated 2–4 days</span></p>
        <p>All orders are Cash on Delivery. Pay in cash when your order arrives. No online payment required.</p>
      </div>
    ),
  },
  returns: {
    title: "Returns & Exchanges",
    body: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-start gap-2"><RotateCcw className="h-4 w-4 mt-0.5 text-primary" /> <span><strong>7-day return:</strong> Wrong size or color? Return within 7 days of delivery.</span></p>
        <p className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 text-primary" /> <span><strong>Damaged items:</strong> Contact us within 48 hours of delivery with photos.</span></p>
        <p>Items must be unworn, unwashed, and with original tags. Refunds are processed manually via mobile transfer.</p>
      </div>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">{page.title}</h1>
        <Card>
          <CardContent className="p-6">{page.body}</CardContent>
        </Card>
      </div>
    </div>
  );
}
