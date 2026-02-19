import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getTransactions,
  getUserAccounts,
  getUserGoals,
} from "@/features/transactions/actions";
import { getBankAccounts } from "@/features/bank-accounts/actions";
import { getDigitalWallets } from "@/features/digital-wallets/actions";
import { getContacts } from "@/features/contacts/actions";
import {
  TransactionsTable,
  TransactionsFilter,
  NewTransactionDialog,
} from "@/features/transactions/components";
import { getTransactionStats } from "@/lib/transactionUtils";
import { fmt } from "@/lib/formatters";
import styles from "./transactions.module.css";

interface Props {
  searchParams: Promise<{
    type?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    currency?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const params = await searchParams;

  const rawTransactionsResult = await getTransactions({
    type: params.type,
    category: params.category,
    search: params.search,
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
    currency: params.currency,
  });

  const [
    accountsResult,
    goalsResult,
    bankAccountsResult,
    walletsResult,
    contactsResult,
  ] = await Promise.all([
    getUserAccounts(),
    getUserGoals(),
    getBankAccounts(),
    getDigitalWallets(),
    getContacts(),
  ]);

  const rawTransactions = rawTransactionsResult.isOk()
    ? rawTransactionsResult.value
    : [];
  const accounts = accountsResult.isOk() ? accountsResult.value : [];
  const goals = goalsResult.isOk() ? goalsResult.value : [];
  const bankAccounts = bankAccountsResult.isOk()
    ? bankAccountsResult.value
    : [];
  const digitalWallets = walletsResult.isOk() ? walletsResult.value : [];
  const contacts = contactsResult.isOk() ? contactsResult.value : [];

  // Deep serialize ALL data for client components (converts Dates to strings)
  const serializedAccounts = JSON.parse(JSON.stringify(accounts));
  const serializedGoals = JSON.parse(JSON.stringify(goals));
  const serializedBankAccounts = JSON.parse(JSON.stringify(bankAccounts));
  const serializedWallets = JSON.parse(JSON.stringify(digitalWallets));
  const serializedContacts = JSON.parse(JSON.stringify(contacts));

  // Create maps from SERIALIZED data
  const accountMap = new Map(
    serializedAccounts.map((acc: any) => [acc.id, acc]),
  );
  const bankAccountMap = new Map(
    serializedBankAccounts.map((acc: any) => [acc.id, acc]),
  );
  const walletMap = new Map(
    serializedWallets.map((wallet: any) => [wallet.id, wallet]),
  );
  const contactMap = new Map(
    serializedContacts.map((contact: any) => [contact.id, contact]),
  );

  // Normalize transaction data for type safety
  const transactions = rawTransactions.map((t) => ({
    ...t,
    isTransferBetweenOwnAccounts: t.isTransferBetweenOwnAccounts ?? false,
    isCashDeposit: t.isCashDeposit ?? false,
    isCashWithdrawal: t.isCashWithdrawal ?? false,
    isTransferToThirdParty: t.isTransferToThirdParty ?? false,
  }));

  // Deep serialize transactions for client components
  const serializedTransactions = JSON.parse(JSON.stringify(transactions));

  // Serialize maps for client components (Maps can't be passed to client components)
  const serializedAccountMap = Object.fromEntries(accountMap);
  const serializedBankAccountMap = Object.fromEntries(bankAccountMap);
  const serializedWalletMap = Object.fromEntries(walletMap);
  const serializedContactMap = Object.fromEntries(contactMap);

  // Calculate summary statistics using helper function
  const { totalIncome, totalExpenses, totalSavings, balance } =
    getTransactionStats(transactions);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Transacciones</h1>
          <p>Visualiza y administra todas tus transacciones financieras</p>
        </div>
        <NewTransactionDialog
          accounts={serializedAccounts}
          goals={serializedGoals}
          bankAccounts={serializedBankAccounts}
          digitalWallets={serializedWallets}
          contacts={serializedContacts}
          triggerClassName={styles.addButton}
        />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-type="income">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Ingresos Totales</p>
            <p className={styles.statValue}>${fmt.number(totalIncome)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} data-type="expense">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
              <polyline points="17 18 23 18 23 12"></polyline>
            </svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Gastos Totales</p>
            <p className={styles.statValue}>${fmt.number(totalExpenses)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} data-type="saving">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Ahorros Totales</p>
            <p className={styles.statValue}>${fmt.number(totalSavings)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            data-type={balance >= 0 ? "income" : "expense"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Balance</p>
            <p className={styles.statValue} data-positive={balance >= 0}>
              ${fmt.number(Math.abs(balance))}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Todas las Transacciones</h2>
          <TransactionsFilter />
        </div>

        <TransactionsTable
          transactions={serializedTransactions}
          accountMap={serializedAccountMap}
          bankAccountMap={serializedBankAccountMap}
          walletMap={serializedWalletMap}
          contactMap={serializedContactMap}
        />

        {serializedTransactions.length === 0 && (
          <div className={styles.emptyState}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>No hay transacciones</h3>
            <p>Comienza agregando tu primera transacción</p>
          </div>
        )}
      </div>
    </div>
  );
}
