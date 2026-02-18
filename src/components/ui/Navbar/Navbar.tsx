import { ReactNode, CSSProperties } from "react";
import styles from "./Navbar.module.css";

type NavbarPosition = "top" | "bottom" | "left" | "right";
type NavbarDirection = "row" | "column";

export interface NavbarProps {
  children: ReactNode;
  position?: NavbarPosition;
  direction?: NavbarDirection;
  sticky?: boolean;
  shadow?: boolean;
  padding?: "small" | "medium" | "large";
  bgColor?: string;
  className?: string;
}

export function Navbar({
  children,
  position = "top",
  direction = "row",
  sticky = false,
  shadow = true,
  padding = "medium",
  bgColor = "var(--navbar-bg)",
  className = "",
}: NavbarProps) {
  const positionClass = styles[`position-${position}`];
  const directionClass = styles[`direction-${direction}`];
  const paddingClass = styles[`padding-${padding}`];
  const shadowClass = shadow ? styles.shadow : "";
  const stickyClass = sticky ? styles.sticky : "";

  const customStyles: CSSProperties = {
    backgroundColor: bgColor,
  };

  return (
    <nav
      className={`${styles.navbar} ${positionClass} ${directionClass} ${paddingClass} ${shadowClass} ${stickyClass} ${className}`}
      style={customStyles}
    >
      {children}
    </nav>
  );
}
