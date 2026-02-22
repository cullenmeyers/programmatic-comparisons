import type { ReactNode } from "react";
import { cx } from "./classnames";

type SectionHeadingProps = {
  title: string;
  subtitle?: ReactNode;
  className?: string;
};

export default function SectionHeading({
  title,
  subtitle,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cx("space-y-2", className)}>
      <h2 className="text-xl font-semibold tracking-tight text-black">{title}</h2>
      {subtitle ? <p className="text-sm leading-6 text-black/65">{subtitle}</p> : null}
    </div>
  );
}
