import styles from "./PaymentCard.module.css";

interface Props {
  bank: string;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function PaymentCardHeader({ bank, onEdit, onDelete }: Props) {
  return (
    <div className={styles.bankRow}>
      <span className={styles.bankName}>{bank}</span>

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={onEdit}
          aria-label="Editar tarjeta"
          title="Editar"
        >
          ✏️
        </button>
        <button
          className={styles.actionBtn}
          onClick={onDelete}
          aria-label="Eliminar tarjeta"
          title="Eliminar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
