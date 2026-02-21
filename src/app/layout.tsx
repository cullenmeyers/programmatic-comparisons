import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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

function HeaderNav() {
  return (
    <header className="border-b border-black/10">
      <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-black/85">
          Decision Clarities
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/compare"
            className="text-black/65 hover:text-black underline-offset-4 hover:underline"
          >
            Compare
          </Link>
          <Link
            href="/tools"
            className="text-black/65 hover:text-black underline-offset-4 hover:underline"
          >
            Tools
          </Link>
          <Link
            href="/about"
            className="text-black/65 hover:text-black underline-offset-4 hover:underline"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-black/65 hover:text-black underline-offset-4 hover:underline"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <HeaderNav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
