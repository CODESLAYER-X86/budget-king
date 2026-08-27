import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget King BD — Quality That Fits Your Budget",
  description:
    "Affordable clothing without compromising quality. Shop shirts with Cash on Delivery, earn Budget Coins, and shop together with friends.",
  keywords: [
    "Budget King BD",
    "Bangladesh clothing",
    "shirts Bangladesh",
    "COD shopping",
    "online shopping BD",
  ],
  authors: [{ name: "Budget King BD" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Budget King BD",
    description: "Quality That Fits Your Budget",
    siteName: "Budget King BD",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  );
}
