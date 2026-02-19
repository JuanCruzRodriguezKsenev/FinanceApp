"use client";

import { useState } from "react";

import Dialog from "@/components/ui/Dialog/Dialog";
import type {
  Account,
  BankAccount,
  Contact,
  DigitalWallet,
  SavingsGoal,
} from "@/types";

import TransactionForm from "./TransactionForm";

interface Props {
  accounts: Account[];
  goals: SavingsGoal[];
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  contacts: Contact[];
  triggerClassName?: string;
}

export default function NewTransactionDialog({
  accounts,
  goals,
  bankAccounts,
  digitalWallets,
  contacts,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nueva Transaccion
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva transaccion"
        variant="default"
      >
        <TransactionForm
          accounts={accounts}
          goals={goals}
          bankAccounts={bankAccounts}
          digitalWallets={digitalWallets}
          contacts={contacts}
          onSuccess={() => setOpen(false)}
          showHeader={false}
          variant="dialog"
        />
      </Dialog>
    </>
  );
}
