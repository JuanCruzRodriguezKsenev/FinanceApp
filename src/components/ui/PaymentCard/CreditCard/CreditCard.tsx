"use client";

import { useEffect, useState } from "react";

import ExpandablePanel from "@/components/ui/ExpandablePanel/ExpandablePanel";
import ProgressBar from "@/components/ui/ProgressBar/ProgressBar";
import { fmt } from "@/lib/formatters";
import { CreditCardData,PaymentCard } from "@/types";

import PaymentCardComponent from "../PaymentCard";
import styles from "./CreditCard.module.css";

interface Props {
  data: CreditCardData;
  onDelete: (id: number) => void;
  onEdit: (p: PaymentCard) => void;
  onSelect: (p: PaymentCard) => void;
  isSelected: boolean;
}

export default function CreditCard(props: Props) {
  const { data, isSelected } = props; // 🌟 CORRECCIÓN DE LÓGICA: Asegurar que consumed siempre sea un número

  const consumedAmount = data.consumed || 0; // --- LÓGICA DE ANIMACIÓN DE LA ETIQUETA ---

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (isSelected) {
      setHasInteracted(true);
    }
  }, [isSelected]);

  let labelAnimationClass = "";

  if (isSelected) {
    labelAnimationClass = styles.creditLabelHidden;
  } else if (hasInteracted) {
    labelAnimationClass = styles.creditLabelVisible;
  } // --- LÓGICA DE FECHAS ROBUSTAS (SIN CAMBIOS) ---

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const closingDateObj = new Date(`${data.closingDate}T00:00:00`);
  const isClosed = today > closingDateObj;

  let dueDateObj: Date;
  let nextClosingDateObj: Date;

  if (isClosed) {
    dueDateObj = new Date(closingDateObj);
    dueDateObj.setDate(closingDateObj.getDate() + 10);

    nextClosingDateObj = new Date(closingDateObj);
    nextClosingDateObj.setMonth(closingDateObj.getMonth() + 1);
  } else {
    dueDateObj = new Date(closingDateObj);
    dueDateObj.setDate(closingDateObj.getDate() + 10);

    nextClosingDateObj = closingDateObj;
  }

  const toLocalISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <PaymentCardComponent {...props}>
      {/* 1. PANEL DESLIZANTE */}
      {""}
      <ExpandablePanel isOpen={isSelected}>
        {""}
        <div className={styles.contentContainer}>
          {""}
          {isClosed ? (
            <>
              {""}
              <ProgressBar
                labelLeft="Total Debt" // 🌟 USAMOS consumedAmount (garantizado como number)
                valueLeft={fmt.currency(consumedAmount)}
                labelRight="Due Date"
                valueRight={fmt.date(toLocalISO(dueDateObj))} // 🌟 USAMOS consumedAmount
                current={consumedAmount}
                total={data.limit}
                isUrgent={true}
              />
              <div className={styles.divider}></div>
              {""}
              <ProgressBar
                labelLeft="New Period"
                valueLeft={fmt.currency(0)}
                labelRight="Next Closing"
                valueRight={fmt.date(toLocalISO(nextClosingDateObj))}
                current={0}
                total={data.limit}
              />
              {""}
            </>
          ) : (
            <ProgressBar
              labelLeft="Spent" // 🌟 USAMOS consumedAmount
              valueLeft={fmt.currency(consumedAmount)}
              labelRight="Closing"
              valueRight={fmt.date(data.closingDate)} // 🌟 USAMOS consumedAmount
              current={consumedAmount}
              total={data.limit}
            />
          )}
          {""}
        </div>
        {""}
      </ExpandablePanel>
      {/* 2. ETIQUETA "CREDIT" */}
      {""}
      <div className={`${styles.creditLabel} ${labelAnimationClass}`}>
        CREDIT{""}
      </div>
      {""}
    </PaymentCardComponent>
  );
}
