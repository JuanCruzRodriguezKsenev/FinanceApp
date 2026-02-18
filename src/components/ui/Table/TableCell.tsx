// src/components/ui/Table/TableCell.tsx
import { ReactNode } from "react";
import styles from "./Table.module.css";

interface Props {
  children: ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
}

export default function TableCell({
  children,
  align = "left",
  width,
  className = "",
}: Props) {
  return (
    <td
      className={`${styles.cell} ${className}`}
      style={{ textAlign: align, width }}
    >
      {children}
    </td>
  );
}
