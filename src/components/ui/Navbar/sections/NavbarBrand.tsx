import Link from "next/link";
import { ReactNode } from "react";

import styles from "./NavbarBrand.module.css";

interface NavbarBrandProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function NavbarBrand({
  children,
  href,
  onClick,
  className = "",
}: NavbarBrandProps) {
  if (href) {
    return (
      <Link href={href} className={`${styles.brand} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <div
      className={`${styles.brand} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}
