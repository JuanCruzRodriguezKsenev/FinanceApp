import { ReactNode } from "react";
import styles from "./NavbarNav.module.css";

interface NavbarNavProps {
  children: ReactNode;
  align?: "start" | "center" | "end";
  gap?: "small" | "medium" | "large";
  className?: string;
}

export function NavbarNav({
  children,
  align = "start",
  gap = "medium",
  className = "",
}: NavbarNavProps) {
  const gapClass = styles[`gap-${gap}`];
  const alignClass = styles[`align-${align}`];

  return (
    <ul className={`${styles.nav} ${gapClass} ${alignClass} ${className}`}>
      {children}
    </ul>
  );
}
