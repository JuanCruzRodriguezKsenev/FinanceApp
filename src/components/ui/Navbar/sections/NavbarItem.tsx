import Link from "next/link";
import { ReactNode } from "react";

import styles from "./NavbarItem.module.css";

interface NavbarItemProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export function NavbarItem({
  children,
  href,
  onClick,
  active = false,
  disabled = false,
  className = "",
}: NavbarItemProps) {
  const activeClass = active ? styles.active : "";
  const disabledClass = disabled ? styles.disabled : "";

  if (href) {
    return (
      <li
        className={`${styles.item} ${activeClass} ${disabledClass} ${className}`}
      >
        <Link href={href} className={styles.link}>
          {children}
        </Link>
      </li>
    );
  }

  return (
    <li
      className={`${styles.item} ${activeClass} ${disabledClass} ${className}`}
      onClick={!disabled ? onClick : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === "Enter" || e.key === " ")) {
          onClick();
        }
      }}
    >
      {!href && <span className={styles.link}>{children}</span>}
    </li>
  );
}
