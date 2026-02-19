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

  // Crear records para lookups eficientes
  const accountMap = useMemo((): Record<string, Account> => {
    const record: Record<string, Account> = {};
    accounts.forEach((acc) => {
      record[acc.id] = acc;
    });
    return record;
  }, [accounts]);

  const bankAccountMap = useMemo((): Record<string, BankAccount> => {
    const record: Record<string, BankAccount> = {};
    bankAccounts.forEach((acc) => {
      record[acc.id] = acc;
    });
    return record;
  }, [bankAccounts]);

  const walletMap = useMemo((): Record<string, DigitalWallet> => {
    const record: Record<string, DigitalWallet> = {};
    digitalWallets.forEach((wallet) => {
      record[wallet.id] = wallet;
    });
    return record;
  }, [digitalWallets]);

  const contactMap = useMemo((): Record<string, Contact> => {
    const record: Record<string, Contact> = {};
    contacts.forEach((contact) => {
      record[contact.id] = contact;
    });
    return record;
  }, [contacts]);

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
