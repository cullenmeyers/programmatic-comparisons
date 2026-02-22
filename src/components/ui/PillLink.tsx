import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./classnames";

type PillLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function PillLink({ href, children, className }: PillLinkProps) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 text-sm text-black/80 transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
        className
      )}
    >
      {children}
    </Link>
  );
}
