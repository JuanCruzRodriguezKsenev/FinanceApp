// src/components/transactions/TransactionsSummary.tsx
"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";

import Card from "@/components/ui/Card/Card";
import { fmt } from "@/lib/formatters";
import { getTransactionStats } from "@/lib/transactionUtils";
import { Transaction } from "@/types";

import styles from "./TransactionsSummary.module.css";

interface Props {
  transactions: Transaction[];
  period?: "today" | "week" | "month" | "all";
}

const PERIOD_LABELS = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  all: "Todos",
};

/**
 * TransactionsSummary - Resumen de ingresos, gastos y balance.
 *
 * Usa estadísticas calculadas y permite navegación a la pantalla de stats.
 *
 * @component
 * @param transactions - Transacciones a resumir.
 * @param period - Etiqueta del período mostrado.
 * @returns JSX.Element
 *
 * @example
 * <TransactionsSummary transactions={transactions} period="month" />
 */
function TransactionsSummary({ transactions, period = "all" }: Props) {
  const router = useRouter();

  // Use centralized helper to calculate stats
  const { totalIncome, totalExpenses, balance } =
    getTransactionStats(transactions);

  const handleNavigateToStats = () => {
    router.push("/statistics");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.periodLabel}>
          Período: <strong>{PERIOD_LABELS[period]}</strong>
        </div>
        <button
          className={styles.statsButton}
          onClick={handleNavigateToStats}
          title="Ver estadísticas detalladas"
        >
          📊 Estadísticas
        </button>
      </div>

      <div className={styles.cards}>
        <Card
          variant="success"
          className={styles.card}
          interactive
          onClick={handleNavigateToStats}
        >
          <div className={styles.cardContent}>
            <span className={styles.label}>Ingresos</span>
            <span className={styles.value}>+{fmt.number(totalIncome)}</span>
          </div>
        </Card>

        <Card
          variant="danger"
          className={styles.card}
          interactive
          onClick={handleNavigateToStats}
        >
          <div className={styles.cardContent}>
            <span className={styles.label}>Gastos</span>
            <span className={styles.value}>−{fmt.number(totalExpenses)}</span>
          </div>
        </Card>

        <Card
          variant={balance >= 0 ? "success" : "danger"}
          className={styles.card}
          interactive
          onClick={handleNavigateToStats}
        >
          <div className={styles.cardContent}>
            <span className={styles.label}>Balance</span>
            <span className={styles.value}>{fmt.number(balance)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default memo(TransactionsSummary);
