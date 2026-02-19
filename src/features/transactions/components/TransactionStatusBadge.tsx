import type { TransactionState } from "@/types";

import styles from "./TransactionStatusBadge.module.css";

const STATUS_CONFIG: Record<
  TransactionState,
  { label: string; className: string }
> = {
  DRAFT: { label: "Borrador", className: "draft" },
  PENDING: { label: "Pendiente", className: "pending" },
  CONFIRMED: { label: "Confirmada", className: "confirmed" },
  FAILED: { label: "Fallida", className: "failed" },
  CANCELLED: { label: "Cancelada", className: "cancelled" },
  RECONCILED: { label: "Conciliada", className: "reconciled" },
};

interface Props {
  state: TransactionState;
}

export default function TransactionStatusBadge({ state }: Props) {
  const config = STATUS_CONFIG[state];

  return (
    <span className={`${styles.badge} ${styles[config.className]}`}>
      {config.label}
    </span>
  );
}
