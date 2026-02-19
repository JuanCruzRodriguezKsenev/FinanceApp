import { ReactNode } from "react";

import styles from "./NavbarEnd.module.css";

interface NavbarEndProps {
  children: ReactNode;
  gap?: "small" | "medium" | "large";
  className?: string;
}

export function NavbarEnd({
  children,
  gap = "medium",
  className = "",
}: NavbarEndProps) {
  const gapClass = styles[`gap-${gap}`];

  return (
    <div className={`${styles.end} ${gapClass} ${className}`}>{children}</div>
  );
}
