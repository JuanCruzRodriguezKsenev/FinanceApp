// src/app/dashboard/page.tsx
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
import DashboardContent from "./DashboardContent";
import styles from "./dashboard.module.css";

interface Props {
  searchParams: Promise<{
    type?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const params = await searchParams;

  const [
    rawTransactionsResult,
    accountsResult,
    goalsResult,
    bankAccountsResult,
    walletsResult,
    contactsResult,
  ] = await Promise.all([
    getTransactions({
      type: params.type,
      category: params.category,
      search: params.search,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    }),
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

  // Normalize transaction data for type safety
  const transactions = rawTransactions.map((t) => ({
    ...t,
    isTransferBetweenOwnAccounts: t.isTransferBetweenOwnAccounts ?? false,
    isCashDeposit: t.isCashDeposit ?? false,
    isCashWithdrawal: t.isCashWithdrawal ?? false,
    isTransferToThirdParty: t.isTransferToThirdParty ?? false,
  }));

  const bankAccounts = bankAccountsResult.isOk()
    ? bankAccountsResult.value
    : [];
  const digitalWallets = walletsResult.isOk() ? walletsResult.value : [];
  const contacts = contactsResult.isOk() ? contactsResult.value : [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard Financiero</h1>
        <p>Gestiona tus ingresos, gastos y ahorros</p>
      </header>

      <DashboardContent
        transactions={transactions}
        accounts={accounts as any}
        goals={goals}
        bankAccounts={bankAccounts}
        digitalWallets={digitalWallets}
        contacts={contacts}
      />
    </div>
  );
}
