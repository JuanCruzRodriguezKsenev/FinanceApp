"use client";

import { ReactNode, useEffect, useState } from "react";
import styles from "./ExpandablePanel.module.css";

interface Props {
  isOpen: boolean;
  children: ReactNode;
}

export default function ExpandablePanel({ isOpen, children }: Props) {
  // Estado para controlar si ya ocurrió la primera interacción
  // Esto evita que la animación de "fadeOut" se ejecute al cargar la página
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasInteracted(true);
    }
  }, [isOpen]);

  // Determinamos qué clase usar
  let animationClass = "";

  if (isOpen) {
    animationClass = styles.expanded;
  } else if (hasInteracted) {
    // Solo aplicamos la animación de salida si el usuario ya interactuó
    animationClass = styles.collapsed;
  }
  // Si !isOpen y !hasInteracted, no hay clase (se usa el display: none del CSS base)

  return (
    <div className={`${styles.slidingWrapper} ${animationClass}`}>
      <div className={styles.innerContent}>{children}</div>
    </div>
  );
}
