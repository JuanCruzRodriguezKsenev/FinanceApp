import { ReactNode } from "react";

import styles from "./ProgressBar.module.css";

/**
 * Props para ProgressBar
 */
interface ProgressBarProps {
  /** Etiqueta izquierda */
  labelLeft: string;
  /** Valor izquierdo */
  valueLeft: ReactNode;
  /** Etiqueta derecha */
  labelRight: string;
  /** Valor derecho */
  valueRight: ReactNode;
  /** Valor actual */
  current: number;
  /** Valor total */
  total: number;
  /** Si el progreso es urgente (cambia estilo) */
  isUrgent?: boolean;
}

/**
 * Componente ProgressBar con información dual
 *
 * @example
 * <ProgressBar
 *   labelLeft="Gastado"
 *   valueLeft="$500"
 *   labelRight="Límite"
 *   valueRight="$1000"
 *   current={500}
 *   total={1000}
 *   isUrgent={true}
 * />
 */
export default function ProgressBar({
  labelLeft,
  valueLeft,
  labelRight,
  valueRight,
  current,
  total,
  isUrgent = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((current / total) * 100, 0), 100);

  return (
    <div className={styles.container}>
      <div className={styles.infoRow}>
        <div className={styles.infoItem}>
          <span className={styles.label}>{labelLeft}</span>
          <span className={styles.value}>{valueLeft}</span>
        </div>

        <div className={`${styles.infoItem} ${styles.alignRight}`}>
          <span className={styles.label}>{labelRight}</span>
          <span
            className={`${styles.value} ${isUrgent ? styles.textUrgent : ""}`}
          >
            {valueRight}
          </span>
        </div>
      </div>

      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${labelLeft}: ${percentage.toFixed(0)}%`}
      >
        <div
          className={`${styles.fill} ${isUrgent ? styles.fillUrgent : ""}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
