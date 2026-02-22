import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./classnames";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export default function ButtonLink({
  href,
  children,
  className,
  variant = "secondary",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
        variant === "primary" &&
          "border-black bg-black px-4 py-2.5 text-white hover:bg-black/90",
        variant === "secondary" &&
          "border-black/15 bg-white px-4 py-2.5 text-black hover:bg-black/[0.03]",
        variant === "ghost" &&
          "border-transparent px-2 py-1 text-black/75 hover:text-black hover:underline underline-offset-4",
        className
      )}
    >
      {children}
    </Link>
  );
}
