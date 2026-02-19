// src/components/transactions/TransactionsTable.tsx
"use client";

import { memo } from "react";

import { Table } from "@/components/ui/Table";
import type {
  Account,
  BankAccount,
  Contact,
  DigitalWallet,
  Transaction,
} from "@/types";

import TransactionRow from "./TransactionRow";

interface Props {
  transactions: Transaction[];
  accountMap: Record<string, Account>;
  bankAccountMap: Record<string, BankAccount>;
  walletMap: Record<string, DigitalWallet>;
  contactMap: Record<string, Contact>;
}

function TransactionsTable({
  transactions,
  accountMap,
  bankAccountMap,
  walletMap,
  contactMap,
}: Props) {
  // Convert records to Maps for internal use
  const accountMapObj = new Map(Object.entries(accountMap));
  const bankAccountMapObj = new Map(Object.entries(bankAccountMap));
  const walletMapObj = new Map(Object.entries(walletMap));
  const contactMapObj = new Map(Object.entries(contactMap));

  return (
    <Table
      data={transactions}
      columns={[
        { key: "date", label: "Fecha", width: "110px" },
        { key: "type", label: "Tipo", width: "130px" },
        { key: "transferLeg", label: "Movimiento", width: "110px" },
        {
          key: "account" as keyof Transaction,
          label: "Cuenta",
          width: "200px",
        },
        {
          key: "contact" as keyof Transaction,
          label: "Contacto",
          width: "160px",
        },
        { key: "description", label: "Detalle", width: "auto" },
        { key: "currency", label: "Moneda", width: "90px" },
        { key: "amount", label: "Monto", width: "130px", align: "right" },
        { key: "state", label: "Estado", width: "120px" },
        { key: "id", label: "Acciones", width: "180px" },
      ]}
      renderRow={(transaction) => (
        <TransactionRow
          transaction={transaction}
          accountMap={accountMapObj}
          bankAccountMap={bankAccountMapObj}
          walletMap={walletMapObj}
          contactMap={contactMapObj}
        />
      )}
      emptyMessage="No hay transacciones"
      striped
      hoverable
    />
  );
}

export default memo(TransactionsTable);
