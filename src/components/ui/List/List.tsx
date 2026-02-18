import { ReactNode } from "react";
import styles from "./List.module.css";

export type ListAlignment = "start" | "center" | "end";
export type ListDirection = "horizontal" | "vertical";

interface Props<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;

  // ✅ CRÍTICO: Función para obtener el ID único de cada item
  // Ejemplo: (item) => item.id
  keyExtractor: (item: T) => string | number;

  // ✅ UX: Qué mostrar si el array está vacío
  emptyComponent?: ReactNode;

  direction?: ListDirection; // Opcional, por defecto vertical
  alignment?: ListAlignment; // Opcional, por defecto start
  gap?: string;
  className?: string;
}

export default function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyComponent,
  direction = "vertical",
  alignment = "start",
  gap = "1rem",
  className = "",
}: Props<T>) {
  // 1. Manejo de Lista Vacía
  if (!items || items.length === 0) {
    if (emptyComponent) {
      return <div className={styles.emptyWrapper}>{emptyComponent}</div>;
    }
    return null; // Si no hay items ni emptyComponent, no renderizamos nada
  }

  // 2. Clases Dinámicas
  const baseClass =
    direction === "vertical"
      ? styles.verticalWrapper
      : styles.horizontalWrapper;

  const alignmentClass = {
    start: styles.alignStart,
    center: styles.alignCenter,
    end: styles.alignEnd,
  }[alignment];

  return (
    <div
      className={`${baseClass} ${alignmentClass} ${className}`}
      style={{ gap }}
    >
      {items.map((item, index) => (
        <div
          // ✅ Usamos el ID real, no el índice
          key={keyExtractor(item)}
          className={
            direction === "vertical"
              ? styles.verticalItem
              : styles.horizontalItem
          }
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
