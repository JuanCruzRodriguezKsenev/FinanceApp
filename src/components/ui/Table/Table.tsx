// src/components/ui/Table/Table.tsx
import { ReactNode } from "react";

import styles from "./Table.module.css";

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: any, item: T) => ReactNode;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  renderRow?: (item: T) => ReactNode;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

export default function Table<T extends { id?: string | number }>({
  data,
  columns,
  renderRow,
  emptyMessage = "No hay datos",
  striped = true,
  hoverable = true,
  className = "",
}: Props<T>) {
  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <table
        className={`${styles.table} ${striped ? styles.striped : ""} ${hoverable ? styles.hoverable : ""}`}
      >
        <thead>
          <tr className={styles.headerRow}>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={styles.header}
                style={{
                  width: column.width,
                  textAlign: column.align || "left",
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderRow
            ? data.map((item) => (
                <tr key={item.id || Math.random()} className={styles.row}>
                  {renderRow(item)}
                </tr>
              ))
            : data.map((item) => (
                <tr key={item.id || Math.random()} className={styles.row}>
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={styles.cell}
                      style={{ textAlign: column.align || "left" }}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export { default as TableCell } from "./TableCell";
export { default as TableHeader } from "./TableHeader";
export { default as TableRow } from "./TableRow";
