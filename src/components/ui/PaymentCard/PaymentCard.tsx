// src/components/ui/PaymentCard/PaymentCard.tsx
"use client";

import { ReactNode } from "react";

import { PaymentCard } from "@/types";

import styles from "./PaymentCard.module.css";
import PaymentCardContent from "./PaymentCardContent";
import PaymentCardFooter from "./PaymentCardFooter";
import PaymentCardHeader from "./PaymentCardHeader";

interface PaymentCardComponentProps {
  data: PaymentCard;
  onDelete: (id: number) => void;
  onEdit: (p: PaymentCard) => void;
  onSelect: (p: PaymentCard) => void;
  isSelected: boolean;
  children?: ReactNode;
}

export default function PaymentCardComponent({
  data,
  onDelete,
  onEdit,
  onSelect,
  isSelected,
  children,
}: PaymentCardComponentProps) {
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(data);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(data);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(data.id);
  };

  return (
    <div
      onClick={handleSelect}
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Tarjeta ${data.bank} terminada en ${data.last4}`}
    >
      <PaymentCardHeader
        bank={data.bank}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <PaymentCardContent
        last4={data.last4}
        expiryMonth={data.expiryMonth}
        expiryYear={data.expiryYear}
        holder={data.holder}
      />

      {children && <PaymentCardFooter>{children}</PaymentCardFooter>}
    </div>
  );
}
