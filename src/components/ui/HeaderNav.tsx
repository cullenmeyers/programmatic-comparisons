"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./classnames";

const navItems = [
  { href: "/compare", label: "Compare" },
  { href: "/tools", label: "Tools" },
  { href: "/system", label: "System" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/10 bg-white">
      <div className="site-container py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          >
            Decision Clarities
          </Link>

          <nav aria-label="Primary" className="flex flex-wrap items-center gap-2 text-sm">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "rounded-md px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                    active
                      ? "bg-black text-white"
                      : "text-black/70 hover:bg-black/[0.04] hover:text-black"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
