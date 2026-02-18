"use client";

import { useState, useRef, ReactNode } from "react";
import Widget from "../Widget/Widget";
import styles from "./WidgetBoard.module.css";

// --- (TUS COMPONENTES DUMMY BalanceContent, etc. VAN AQUÍ IGUAL QUE ANTES) ---
// ... (Copiar del paso anterior) ...
// Para ahorrar espacio aquí, asumo que mantienes BalanceContent, ActionsContent, etc.
// Si los necesitas, avísame.

// REGISTRO DE WIDGETS
const WIDGET_REGISTRY: Record<string, ReactNode> = {
  // ... (Tus widgets registrados) ...
  // Ejemplo:
  // balance: <BalanceContent />,
  // actions: <ActionsContent />, etc.
};

type WidgetItem = {
  id: string;
  w: number;
};

export default function WidgetBoard() {
  const [layout, setLayout] = useState<WidgetItem[]>([
    { id: "balance", w: 2 },
    { id: "actions", w: 1 },
    { id: "chart", w: 3 },
    { id: "history", w: 2 },
  ]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- ARRASTRE ---
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (index: number) => {
    // PROTECCIÓN: Si estamos sobre el mismo item, o no hay nada arrastrando, salimos.
    // Esto evita cálculos innecesarios 60 veces por segundo.
    if (dragItem.current === null || dragItem.current === index) return;

    dragOverItem.current = index;

    // SWAP EN TIEMPO REAL
    setLayout((prev) => {
      const newLayout = [...prev];
      const draggedItem = newLayout[dragItem.current!];

      // Removemos del lugar viejo
      newLayout.splice(dragItem.current!, 1);
      // Ponemos en el lugar nuevo
      newLayout.splice(index, 0, draggedItem);

      // ¡CRUCIAL! Actualizamos el ref para seguir al item
      dragItem.current = index;

      return newLayout;
    });
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    // Aquí guardarías en BD
  };

  // --- RESIZE ---
  const handleResize = (id: string, newWidth: number) => {
    setLayout((prev) =>
      prev.map((item) => (item.id === id ? { ...item, w: newWidth } : item))
    );
  };

  return (
    <div className={styles.boardGrid}>
      {layout.map((item, index) => (
        <Widget
          key={item.id} // La KEY es vital para que React no pierda el foco al mover
          id={item.id}
          index={index}
          width={item.w}
          onResize={handleResize}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {WIDGET_REGISTRY[item.id] || <div>Widget...</div>}
        </Widget>
      ))}
    </div>
  );
}
