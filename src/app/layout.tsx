import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Madina Mobile Gadgets | Mobile Accessories Wholesale & Retail in Pakistan",
    template: "%s | Madina Mobile Gadgets",
  },
  description:
    "Original chargers, earbuds, power banks, cables, cases and smartphones at wholesale & retail prices. Cash on Delivery all over Pakistan. Haroonabad.",
  applicationName: "Madina Mobile Gadgets",
  keywords: ["mobile accessories", "wholesale mobile accessories", "Haroonabad", "chargers", "earbuds", "power banks", "Pakistan"],
  openGraph: {
    type: "website",
    siteName: "Madina Mobile Gadgets",
    locale: "en_PK",
    images: [{ url: "/brand/banner.jpg", alt: "Madina Mobile Gadgets" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#14286b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
