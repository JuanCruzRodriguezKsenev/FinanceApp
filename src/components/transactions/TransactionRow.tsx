// src/components/transactions/TransactionRow.tsx
"use client";

import type {
  Transaction,
  Account,
  BankAccount,
  DigitalWallet,
  Contact,
} from "@/types";
import styles from "./TransactionRow.module.css";
import { deleteTransaction } from "@/core/actions/transactions";
import { useTransition, memo } from "react";
import { TableCell } from "@/components/ui/Table";
import {
  getCategoryLabel,
  getTransactionTypeName,
} from "@/constants/transactionLabels";
import { fmt } from "@/lib/formatters";

interface Props {
  transaction: Transaction;
  accountMap: Map<string, Account>;
  bankAccountMap: Map<string, BankAccount>;
  walletMap: Map<string, DigitalWallet>;
  contactMap: Map<string, Contact>;
}

function TransactionRow({
  transaction,
  accountMap,
  bankAccountMap,
  walletMap,
  contactMap,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("¿Estás seguro de eliminar esta transacción?")) {
      startTransition(async () => {
        await deleteTransaction(transaction.id);
      });
    }
  };

  const formattedAmount = fmt.number(transaction.amount);
  const formattedDate = fmt.date(transaction.date);

  const isOutflowLeg =
    transaction.transferLeg === "outflow" ||
    transaction.type === "expense" ||
    transaction.type === "withdrawal" ||
    transaction.type === "transfer_third_party";
  const isInflowLeg =
    transaction.transferLeg === "inflow" ||
    transaction.type === "income" ||
    transaction.type === "deposit";

  const amountColor = isInflowLeg
    ? "positive"
    : isOutflowLeg
      ? "negative"
      : "neutral";

  const typeLabel = getTransactionTypeName(transaction.type);
  const categoryLabel = getCategoryLabel(transaction.category);

  const resolveAccountLabel = (params: {
    bankAccountId?: string | null;
    walletId?: string | null;
    accountId?: string | null;
  }) => {
    if (params.bankAccountId) {
      const account = bankAccountMap.get(params.bankAccountId);
      return account ? account.accountName : "Cuenta bancaria";
    }
    if (params.walletId) {
      const wallet = walletMap.get(params.walletId);
      return wallet ? wallet.walletName : "Billetera";
    }
    if (params.accountId) {
      const account = accountMap.get(params.accountId);
      return account ? account.name : "Cuenta";
    }
    return null;
  };

  const fromLabel = resolveAccountLabel({
    bankAccountId: transaction.fromBankAccountId,
    walletId: transaction.fromWalletId,
    accountId: transaction.fromAccountId,
  });
  const toLabel = resolveAccountLabel({
    bankAccountId: transaction.toBankAccountId,
    walletId: transaction.toWalletId,
    accountId: transaction.toAccountId,
  });
  const accountLabel =
    fromLabel && toLabel
      ? `${fromLabel} → ${toLabel}`
      : fromLabel || toLabel || "—";

  const contact = transaction.contactId
    ? contactMap.get(transaction.contactId)
    : undefined;
  const contactLabel =
    contact?.displayName ||
    contact?.name ||
    transaction.transferRecipient ||
    transaction.transferSender ||
    "—";

  const movementLabel = transaction.transferLeg
    ? transaction.transferLeg === "outflow"
      ? "Salida"
      : "Entrada"
    : isOutflowLeg
      ? "Salida"
      : isInflowLeg
        ? "Entrada"
        : "—";

  return (
    <>
      <TableCell className={styles.cellDate}>{formattedDate}</TableCell>
      <TableCell className={styles.cellType}>{typeLabel}</TableCell>
      <TableCell className={styles.cellLeg}>{movementLabel}</TableCell>
      <TableCell className={styles.cellAccount}>{accountLabel}</TableCell>
      <TableCell className={styles.cellContact}>{contactLabel}</TableCell>
      <TableCell className={styles.cellDescription}>
        <div>{transaction.description}</div>
        <div className={styles.cellCategory}>{categoryLabel}</div>
      </TableCell>
      <TableCell className={styles.cellCurrency}>
        {transaction.currency || "—"}
      </TableCell>
      <TableCell
        align="right"
        className={`${styles.cellAmount} ${styles[amountColor]}`}
      >
        <span className={styles.amountContent}>
          {isInflowLeg && <span className={styles.symbol}>+</span>}
          {isOutflowLeg && <span className={styles.symbol}>−</span>}
          {formattedAmount}
        </span>
      </TableCell>
      <TableCell className={styles.flagsCell}>
        <div className={styles.flagsContent}>
          {transaction.isTransferBetweenOwnAccounts && (
            <span className={styles.badge} title="Transferencia Interna">
              🔄
            </span>
          )}
          {transaction.isTransferToThirdParty && (
            <span className={styles.badge} title="Pago a Tercero">
              👤
            </span>
          )}
          {transaction.isCashWithdrawal && (
            <span className={styles.badge} title="Retiro de Efectivo">
              💵
            </span>
          )}
          {transaction.isCashDeposit && (
            <span className={styles.badge} title="Depósito de Efectivo">
              💰
            </span>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className={styles.deleteBtn}
          >
            {isPending ? "⏳" : "✕"}
          </button>
        </div>
      </TableCell>
    </>
  );
}

export default memo(TransactionRow);
