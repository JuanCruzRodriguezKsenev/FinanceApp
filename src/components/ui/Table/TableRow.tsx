// src/components/ui/Table/TableRow.tsx
import { ReactNode } from "react";
import styles from "./Table.module.css";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function TableRow({ children, onClick, className = "" }: Props) {
  return (
    <tr className={`${styles.row} ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
}
