// src/components/ui/Table/TableHeader.tsx
import { ReactNode } from "react";
import styles from "./Table.module.css";

interface Props {
  children: ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
}

export default function TableHeader({
  children,
  align = "left",
  width,
  className = "",
}: Props) {
  return (
    <th
      className={`${styles.header} ${className}`}
      style={{ textAlign: align, width }}
    >
      {children}
    </th>
  );
}