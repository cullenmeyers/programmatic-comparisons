import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import HeaderNav from "@/components/ui/HeaderNav";
import SiteFooter from "@/components/ui/SiteFooter";
import { PUBLIC_BRAND_NAME, getSiteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: PUBLIC_BRAND_NAME,
  title: {
    default: PUBLIC_BRAND_NAME,
    template: `%s | ${PUBLIC_BRAND_NAME}`,
  },
  description:
    "Constraint-based tool comparisons: X vs Y for a specific persona. Clear decision rules, not feature lists.",
  openGraph: {
    title: PUBLIC_BRAND_NAME,
    description:
      "Constraint-based tool comparisons: X vs Y for a specific persona. Clear decision rules, not feature lists.",
    siteName: PUBLIC_BRAND_NAME,
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: PUBLIC_BRAND_NAME,
    description:
      "Constraint-based tool comparisons: X vs Y for a specific persona. Clear decision rules, not feature lists.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HeaderNav />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
