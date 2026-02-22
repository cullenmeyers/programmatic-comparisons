import type { ReactNode } from "react";
import { cx } from "./classnames";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cx("rounded-xl border border-black/10 bg-white p-5", className)}>
      {children}
    </div>
  );
}
