import { ReactNode } from "react";
import styles from "./PaymentCard.module.css";

interface Props {
  children: ReactNode;
}

export default function PaymentCardFooter({ children }: Props) {
  return <div className={styles.bottomBarArea}>{children}</div>;
}
