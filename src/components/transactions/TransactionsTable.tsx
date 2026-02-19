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
  accountMap: Map<string, Account>;
  bankAccountMap: Map<string, BankAccount>;
  walletMap: Map<string, DigitalWallet>;
  contactMap: Map<string, Contact>;
}

function TransactionsTable({
  transactions,
  accountMap,
  bankAccountMap,
  walletMap,
  contactMap,
}: Props) {
  return (
    <Table
      data={transactions}
      columns={[
        { key: "date", label: "Fecha", width: "110px" },
        { key: "type", label: "Tipo", width: "130px" },
        { key: "transferLeg", label: "Movimiento", width: "110px" },
        { key: "fromAccountId", label: "Cuenta", width: "200px" },
        { key: "contactId", label: "Contacto", width: "160px" },
        { key: "description", label: "Detalle", width: "auto" },
        { key: "currency", label: "Moneda", width: "90px" },
        { key: "amount", label: "Monto", width: "130px", align: "right" },
        { key: "state", label: "Estado", width: "120px" },
        { key: "id", label: "Acciones", width: "180px" },
      ]}
      renderRow={(transaction: Transaction) => (
        <TransactionRow
          transaction={transaction}
          accountMap={accountMap}
          bankAccountMap={bankAccountMap}
          walletMap={walletMap}
          contactMap={contactMap}
        />
      )}
      emptyMessage="No hay transacciones"
      striped
      hoverable
    />
  );
}

export default memo(TransactionsTable);
