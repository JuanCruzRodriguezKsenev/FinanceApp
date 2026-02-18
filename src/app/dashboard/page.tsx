// src/app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getTransactions,
  getUserAccounts,
  getUserGoals,
} from "@/core/actions/transactions";
import { getBankAccounts } from "@/core/actions/bank-accounts";
import { getDigitalWallets } from "@/core/actions/digital-wallets";
import { getContacts } from "@/core/actions/contacts";
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
    rawTransactions, 
    accounts, 
    goals,
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

  // Normalize transaction data for type safety
  const transactions = rawTransactions.map((t) => ({
    ...t,
    isTransferBetweenOwnAccounts: t.isTransferBetweenOwnAccounts ?? false,
    isCashDeposit: t.isCashDeposit ?? false,
    isCashWithdrawal: t.isCashWithdrawal ?? false,
    isTransferToThirdParty: t.isTransferToThirdParty ?? false,
  }));

  const bankAccounts = bankAccountsResult.data || [];
  const digitalWallets = walletsResult.data || [];
  const contacts = contactsResult.data || [];

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
