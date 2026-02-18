/**
 * DashboardContent - Componente cliente que maneja eventos de transacciones
 *
 * Este componente implementa el patrón Observer para escuchar eventos
 * del EventBus y refrescar los datos del dashboard automáticamente.
 *
 * Diagrama:
 * ```
 * TransactionForm  ──publish('transaction:created')──▶  EventBus
 *                                                           │
 *                                                           │
 *                                  subscribe('transaction:created')
 *                                                           │
 *                                                           ▼
 *                                                    DashboardContent
 *                                                           │
 *                                                    router.refresh()
 *                                                           │
 *                                                           ▼
 *                                              Server re-fetches data
 *                                                           │
 *                                                           ▼
 *                                          Table y Summary se actualizan
 * ```
 */
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { eventBus, EVENTS } from "@/lib/eventBus";
import { logger } from "@/lib/logger";
import {
  TransactionForm,
  TransactionsTable,
  TransactionsSummary,
  TransactionsFilter,
} from "@/features/transactions/components";
import type {
  Transaction,
  Account,
  SavingsGoal,
  BankAccount,
  DigitalWallet,
  Contact,
} from "@/types";
import styles from "./dashboard.module.css";

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  goals: SavingsGoal[];
  bankAccounts?: BankAccount[];
  digitalWallets?: DigitalWallet[];
  contacts?: Contact[];
}

export default function DashboardContent({
  transactions,
  accounts,
  goals,
  bankAccounts = [],
  digitalWallets = [],
  contacts = [],
}: Props) {
  const router = useRouter();

  // Crear maps para lookups eficientes
  const accountMap = useMemo(
    () => new Map(accounts.map((acc) => [acc.id, acc])),
    [accounts],
  );

  const bankAccountMap = useMemo(
    () => new Map(bankAccounts.map((acc) => [acc.id, acc])),
    [bankAccounts],
  );

  const walletMap = useMemo(
    () => new Map(digitalWallets.map((wallet) => [wallet.id, wallet])),
    [digitalWallets],
  );

  const contactMap = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  );

  // Observer Pattern: Escuchar eventos de transacciones
  useEffect(() => {
    // Suscribirse al evento de transacción creada
    const unsubscribeCreated = eventBus.subscribe(
      EVENTS.TRANSACTION.CREATED,
      (data) => {
        logger.debug("Nueva transacción detectada", { transaction: data });

        // Refrescar datos del servidor
        router.refresh();
      },
    );

    // Suscribirse al evento de transacción actualizada
    const unsubscribeUpdated = eventBus.subscribe(
      EVENTS.TRANSACTION.UPDATED,
      (data) => {
        logger.debug("Transacción actualizada", { transaction: data });
        router.refresh();
      },
    );

    // Suscribirse al evento de transacción eliminada
    const unsubscribeDeleted = eventBus.subscribe(
      EVENTS.TRANSACTION.DELETED,
      (data) => {
        logger.debug("Transacción eliminada", { transaction: data });
        router.refresh();
      },
    );

    // Cleanup: Desuscribirse al desmontar
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [router]);

  return (
    <div className={styles.content}>
      <aside className={styles.sidebar}>
        <TransactionForm
          accounts={accounts}
          goals={goals}
          bankAccounts={bankAccounts}
          digitalWallets={digitalWallets}
          contacts={contacts}
        />
      </aside>

      <main className={styles.main}>
        <TransactionsSummary transactions={transactions} period="month" />
        <TransactionsFilter />
        <TransactionsTable
          transactions={transactions}
          accountMap={accountMap}
          bankAccountMap={bankAccountMap}
          walletMap={walletMap}
          contactMap={contactMap}
        />
      </main>
    </div>
  );
}
