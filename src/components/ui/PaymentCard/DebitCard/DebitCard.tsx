import PaymentCardComponent from "../PaymentCard";
import { PaymentCard, DebitCardData } from "@/types";
import styles from "./DebitCard.module.css"; // Import the new CSS module

interface Props {
  data: DebitCardData;
  onDelete: (id: number) => void;
  onEdit: (p: PaymentCard) => void;
  onSelect: (p: PaymentCard) => void;
  isSelected: boolean;
}

export default function DebitCard(props: Props) {
  return (
    <PaymentCardComponent {...props}>
      {/* We apply the class from the module instead of inline styles */}
      <div className={styles.debitLabel}>DEBIT</div>
    </PaymentCardComponent>
  );
}
