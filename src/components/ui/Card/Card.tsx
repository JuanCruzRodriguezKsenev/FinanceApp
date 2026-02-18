import { ReactNode, CSSProperties } from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean; // Activa hover y cursor pointer
  variant?: "default" | "success" | "danger" | "warning" | "info";
  style?: CSSProperties;
}

export default function Card({
  children,
  className = "",
  onClick,
  interactive = false,
  variant = "default",
  style,
}: CardProps) {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${interactive ? styles.interactive : ""} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
