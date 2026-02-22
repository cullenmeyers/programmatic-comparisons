import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import HeaderNav from "@/components/ui/HeaderNav";
import SiteFooter from "@/components/ui/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// TODO: set this to your final domain once connected (keep https)
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://tool-compare.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Decision Clarities",
    template: "%s | Decision Clarities",
  },
  description:
    "Constraint-based tool comparisons: X vs Y for a specific persona. Clear decision rules, not feature lists.",
  openGraph: {
    title: "Decision Clarities",
    description:
      "Constraint-based tool comparisons: X vs Y for a specific persona. Clear decision rules, not feature lists.",
    type: "website",
    url: SITE_URL,
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
