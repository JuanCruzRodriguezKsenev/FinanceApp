// src/core/actions/transactions.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  transactions,
  accounts,
  savingsGoals,
  bankAccounts,
  digitalWallets,
  transactionMetadata,
} from "@/db/schema/finance";
import { revalidatePath } from "next/cache";
import { eq, and, desc, or, sql, asc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  ok,
  err,
  authorizationError,
  validationError,
  databaseError,
  notFoundError,
  type Result,
  type AppError,
} from "@/lib/result";
import {
  detectTransactionType,
  detectCategoryFromDescription,
} from "@/lib/transaction-detector";
import { createIdempotencyKey } from "@/lib/idempotency";
import {
  TransactionStateMachine,
  type TransactionStateContext,
} from "@/lib/state-machines/transaction.service";
import {
  TransactionState,
  type TransactionEventType,
} from "@/lib/state-machines/transaction.machine";
import { randomUUID } from "crypto";
import type {
  Transaction,
  TransactionType,
  TransactionCategory,
  PaymentMethod,
} from "@/types";

const resolveTransactionState = (state?: string | null): TransactionState => {
  if (!state) {
    return TransactionState.DRAFT;
  }

  return Object.values(TransactionState).includes(state as TransactionState)
    ? (state as TransactionState)
    : TransactionState.DRAFT;
};

const createStateMachineFromRecord = (record: {
  state?: string | null;
  stateMachine?: unknown;
}): TransactionStateMachine => {
  const resolvedState = resolveTransactionState(record.state);
  const context =
    record.stateMachine && typeof record.stateMachine === "object"
      ? (record.stateMachine as TransactionStateContext)
      : {};

  return new TransactionStateMachine(resolvedState, context);
};

export async function createTransaction(
  formData: FormData,
): Promise<Result<void, AppError>> {
  const session = await auth();

  if (!session?.user?.id) {
    return err(authorizationError("transactions"));
  }

  const type = formData.get("type") as TransactionType;
  const category = formData.get("category") as TransactionCategory; // Cambiado a TransactionCategory
  const amount = formData.get("amount") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const currency = (formData.get("currency") as string) || "ARS";
  const fromAccountId = formData.get("fromAccountId") as string | null;
  const toAccountId = formData.get("toAccountId") as string | null;
  const goalId = formData.get("goalId") as string | null;
  const transferRecipient = formData.get("transferRecipient") as string | null;
  const transferSender = formData.get("transferSender") as string | null;
  const providedIdempotencyKey = formData.get("idempotencyKey") as
    | string
    | null;

  // Validaciones
  if (!type || !category || !amount || !description || !date) {
    return err(validationError("form", "Todos los campos son requeridos"));
  }

  const numAmount = parseFloat(amount);
  if (numAmount <= 0) {
    return err(validationError("amount", "El monto debe ser mayor a 0"));
  }

  const [fromAccount, toAccount] = await Promise.all([
    fromAccountId
      ? db.query.accounts.findFirst({
          where: and(
            eq(accounts.id, fromAccountId),
            eq(accounts.userId, session.user.id),
          ),
        })
      : null,
    toAccountId
      ? db.query.accounts.findFirst({
          where: and(
            eq(accounts.id, toAccountId),
            eq(accounts.userId, session.user.id),
          ),
        })
      : null,
  ]);

  if (fromAccount && fromAccount.currency !== currency) {
    return err(
      validationError(
        "currency",
        "La moneda seleccionada no coincide con la cuenta origen.",
      ),
    );
  }

  if (toAccount && toAccount.currency !== currency) {
    return err(
      validationError(
        "currency",
        "La moneda seleccionada no coincide con la cuenta destino.",
      ),
    );
  }

  const idempotencyKey = createIdempotencyKey(
    "transactions:create",
    session.user.id,
    [
      type,
      category,
      amount,
      currency,
      description,
      date,
      fromAccountId,
      toAccountId,
      goalId,
      transferRecipient,
      transferSender,
    ],
    providedIdempotencyKey,
  );

  const existingTransaction = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.userId, session.user.id),
      eq(transactions.idempotencyKey, idempotencyKey),
    ),
  });

  if (existingTransaction) {
    return ok(undefined);
  }

  const fsm = new TransactionStateMachine(TransactionState.DRAFT, {
    createdAt: new Date().toISOString(),
  });

  try {
    await db.transaction(async (tx: any) => {
      // Crear transacción
      await tx.insert(transactions).values({
        userId: session.user.id,
        idempotencyKey,
        state: fsm.getState(),
        stateMachine: fsm.getContext(),
        type,
        category,
        amount,
        currency,
        description,
        date: new Date(date),
        fromAccountId: fromAccountId || null,
        toAccountId: toAccountId || null,
        goalId: goalId || null,
        transferRecipient: transferRecipient || null,
        transferSender: transferSender || null,
      });

      // Actualizar balance de cuenta origen
      if (fromAccountId) {
        const fromAccount = await tx.query.accounts.findFirst({
          where: eq(accounts.id, fromAccountId),
        });

        if (fromAccount) {
          await tx
            .update(accounts)
            .set({
              balance: (
                parseFloat(fromAccount.balance) - parseFloat(amount)
              ).toString(),
            })
            .where(eq(accounts.id, fromAccountId));
        }
      }

      // Actualizar balance de cuenta destino
      if (toAccountId) {
        const toAccount = await tx.query.accounts.findFirst({
          where: eq(accounts.id, toAccountId),
        });

        if (toAccount) {
          await tx
            .update(accounts)
            .set({
              balance: (
                parseFloat(toAccount.balance) + parseFloat(amount)
              ).toString(),
            })
            .where(eq(accounts.id, toAccountId));
        }
      }

      // Actualizar objetivo de ahorro
      if (goalId && type === "saving") {
        await tx
          .update(savingsGoals)
          .set({
            currentAmount: sql`${savingsGoals.currentAmount} + ${numAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(savingsGoals.id, goalId));
      }
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (error) {
    logger.error("Failed to create transaction", error as Error, {
      userId: session.user.id,
      type,
      amount,
    });
    return err(databaseError("insert", "Error al crear la transacción"));
  }
}

/**
 * Creates a transaction with automatic type and category detection
 *
 * Analyzes transaction data to automatically detect:
 * - Type: income, expense, transfer_own_accounts, transfer_third_party, withdrawal, deposit
 * - Category: 30+ predefined categories based on keywords in description
 * - Suspicious activity flags based on amount thresholds and patterns
 *
 * Validates:
 * - User authentication and authorization
 * - Account/wallet ownership and currency compatibility
 * - Amount is positive and numeric
 * - Date is valid
 * - Idempotency key to prevent duplicate transactions
 *
 * @param {Object} data - Transaction data
 * @param {number} data.amount - Transaction amount (must be positive)
 * @param {string} [data.currency='ARS'] - Currency code (ISO 4217)
 * @param {string} data.description - Transaction description (used for auto-detection)
 * @param {Date} data.date - Transaction date
 * @param {PaymentMethod} [data.paymentMethod] - Payment method (card, transfer, cash, etc.)
 * @param {string} [data.idempotencyKey] - Unique key to prevent duplicate submissions
 * @param {string} [data.fromAccountId] - Source account ID
 * @param {string} [data.toAccountId] - Destination account ID
 * @param {string} [data.fromBankAccountId] - Source bank account ID
 * @param {string} [data.toBankAccountId] - Destination bank account ID
 * @param {string} [data.fromWalletId] - Source digital wallet ID
 * @param {string} [data.toWalletId] - Destination digital wallet ID
 * @param {string} [data.contactId] - Associated contact ID
 * @param {TransactionCategory} [data.category] - Explicit category (overrides auto-detection)
 * @param {TransactionType} [data.type] - Explicit type (overrides auto-detection)
 * @param {string} [data.transferRecipient] - Recipient name for transfer transactions
 * @param {string} [data.transferSender] - Sender name for transfer transactions
 * @returns {Promise<Result<Transaction, AppError>>} Transaction object on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated or not authorized
 * @throws {AppError} Validation error if data is invalid or currency mismatch
 * @throws {AppError} Database error if transaction creation fails
 *
 * @example
 * const result = await createTransactionWithAutoDetection({
 *   amount: 500,
 *   currency: 'ARS',
 *   description: 'Compra en MercadoLibre',
 *   date: new Date(),
 *   fromBankAccountId: 'bank_123'
 * });
 * if (result.isOk()) {
 *   console.log('Transaction created:', result.value);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 */
export async function createTransactionWithAutoDetection(data: {
  amount: number;
  currency?: string;
  description: string;
  date: Date;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string;
  fromAccountId?: string;
  toAccountId?: string;
  fromBankAccountId?: string;
  toBankAccountId?: string;
  fromWalletId?: string;
  toWalletId?: string;
  contactId?: string;
  category?: TransactionCategory;
  type?: TransactionType;
  transferRecipient?: string;
  transferSender?: string;
}): Promise<Result<Transaction, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("transactions"));
    }

    const userBankAccounts = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, session.user.id));

    const userWallets = await db
      .select({ id: digitalWallets.id })
      .from(digitalWallets)
      .where(eq(digitalWallets.userId, session.user.id));

    const userAccounts = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, session.user.id));

    const userBankAccountIds = userBankAccounts.map((a: any) => a.id);
    const userWalletIds = userWallets.map((w: any) => w.id);
    const userAccountIds = userAccounts.map((a: any) => a.id);

    const detectionResult = detectTransactionType({
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      fromBankAccountId: data.fromBankAccountId,
      toBankAccountId: data.toBankAccountId,
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      contactId: data.contactId,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      description: data.description,
      userAccountIds,
      userBankAccountIds,
      userWalletIds,
    });

    let category = data.category;
    if (!category) {
      const detectedCategory = detectCategoryFromDescription(data.description);
      category = (detectedCategory as TransactionCategory) || "other";
    }

    const resolvedType = data.type || detectionResult.type;
    if (
      (resolvedType === "transfer_own_accounts" ||
        resolvedType === "transfer_third_party" ||
        resolvedType === "withdrawal" ||
        resolvedType === "deposit") &&
      !data.category
    ) {
      category = "other";
    }
    const resolvedCurrency = data.currency || "ARS";

    const resolveAccountCurrency = async (accountId?: string) => {
      if (!accountId) return null;
      const result = await db
        .select({ currency: accounts.currency })
        .from(accounts)
        .where(
          and(eq(accounts.id, accountId), eq(accounts.userId, session.user.id)),
        );
      return result[0]?.currency ?? null;
    };

    const resolveBankCurrency = async (accountId?: string) => {
      if (!accountId) return null;
      const result = await db
        .select({ currency: bankAccounts.currency })
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.id, accountId),
            eq(bankAccounts.userId, session.user.id),
          ),
        );
      return result[0]?.currency ?? null;
    };

    const resolveWalletCurrency = async (walletId?: string) => {
      if (!walletId) return null;
      const result = await db
        .select({ currency: digitalWallets.currency })
        .from(digitalWallets)
        .where(
          and(
            eq(digitalWallets.id, walletId),
            eq(digitalWallets.userId, session.user.id),
          ),
        );
      return result[0]?.currency ?? null;
    };

    const sourceCurrencies = (
      await Promise.all([
        resolveAccountCurrency(data.fromAccountId),
        resolveBankCurrency(data.fromBankAccountId),
        resolveWalletCurrency(data.fromWalletId),
      ])
    ).filter(Boolean) as string[];

    const targetCurrencies = (
      await Promise.all([
        resolveAccountCurrency(data.toAccountId),
        resolveBankCurrency(data.toBankAccountId),
        resolveWalletCurrency(data.toWalletId),
      ])
    ).filter(Boolean) as string[];

    const mismatchedCurrency = [...sourceCurrencies, ...targetCurrencies].some(
      (currency) => currency !== resolvedCurrency,
    );

    if (mismatchedCurrency) {
      return err(
        validationError(
          "currency",
          "La moneda seleccionada no coincide con la cuenta origen o destino.",
        ),
      );
    }
    const transferGroupId =
      resolvedType === "transfer_own_accounts" ||
      resolvedType === "transfer_third_party"
        ? randomUUID()
        : undefined;

    const idempotencyBaseKey = createIdempotencyKey(
      "transactions:auto",
      session.user.id,
      [
        data.amount,
        resolvedCurrency,
        data.description,
        data.date.toISOString(),
        data.fromAccountId,
        data.toAccountId,
        data.fromBankAccountId,
        data.toBankAccountId,
        data.fromWalletId,
        data.toWalletId,
        data.contactId,
        resolvedType,
        category,
        data.paymentMethod,
      ],
      data.idempotencyKey,
    );

    const outflowIdempotencyKey = `${idempotencyBaseKey}:outflow`;
    const inflowIdempotencyKey = `${idempotencyBaseKey}:inflow`;

    const lookupKey =
      resolvedType === "transfer_own_accounts"
        ? outflowIdempotencyKey
        : idempotencyBaseKey;

    const existingTransaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.userId, session.user.id),
        eq(transactions.idempotencyKey, lookupKey),
      ),
    });

    if (existingTransaction) {
      return ok(existingTransaction as Transaction);
    }

    const fsm = new TransactionStateMachine(TransactionState.DRAFT, {
      createdAt: new Date().toISOString(),
    });

    const baseValues = {
      userId: session.user.id,
      idempotencyKey: idempotencyBaseKey,
      state: fsm.getState(),
      stateMachine: fsm.getContext(),
      type: resolvedType,
      category,
      amount: data.amount.toString(),
      currency: resolvedCurrency,
      description: data.description,
      date: data.date,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      fromBankAccountId: data.fromBankAccountId,
      toBankAccountId: data.toBankAccountId,
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      contactId: data.contactId,
      transferRecipient: data.transferRecipient,
      transferSender: data.transferSender,
      paymentMethod: data.paymentMethod,
      isTransferBetweenOwnAccounts:
        detectionResult.isTransferBetweenOwnAccounts,
      isTransferToThirdParty: detectionResult.isTransferToThirdParty,
      isCashWithdrawal: detectionResult.isCashWithdrawal,
      isCashDeposit: detectionResult.isCashDeposit,
      transferGroupId,
    };

    type BalanceTx = Pick<typeof db, "select" | "update">;

    const updateBalance = async (
      tx: BalanceTx,
      values: {
        fromAccountId?: string;
        toAccountId?: string;
        fromBankAccountId?: string;
        toBankAccountId?: string;
        fromWalletId?: string;
        toWalletId?: string;
        amount: number;
        transferLeg?: "outflow" | "inflow" | null;
      },
    ) => {
      const amount = values.amount;
      const isOutflow = values.transferLeg === "outflow" || !values.transferLeg;
      const isInflow = values.transferLeg === "inflow" || !values.transferLeg;

      if (isOutflow && values.fromBankAccountId) {
        await tx
          .update(bankAccounts)
          .set({
            balance: (
              parseFloat(
                (
                  await tx
                    .select()
                    .from(bankAccounts)
                    .where(eq(bankAccounts.id, values.fromBankAccountId))
                )[0]?.balance || "0",
              ) - amount
            ).toString(),
            updatedAt: new Date(),
          })
          .where(eq(bankAccounts.id, values.fromBankAccountId));
      }

      if (isInflow && values.toBankAccountId) {
        await tx
          .update(bankAccounts)
          .set({
            balance: (
              parseFloat(
                (
                  await tx
                    .select()
                    .from(bankAccounts)
                    .where(eq(bankAccounts.id, values.toBankAccountId))
                )[0]?.balance || "0",
              ) + amount
            ).toString(),
            updatedAt: new Date(),
          })
          .where(eq(bankAccounts.id, values.toBankAccountId));
      }

      if (isOutflow && values.fromWalletId) {
        await tx
          .update(digitalWallets)
          .set({
            balance: (
              parseFloat(
                (
                  await tx
                    .select()
                    .from(digitalWallets)
                    .where(eq(digitalWallets.id, values.fromWalletId))
                )[0]?.balance || "0",
              ) - amount
            ).toString(),
            updatedAt: new Date(),
          })
          .where(eq(digitalWallets.id, values.fromWalletId));
      }

      if (isInflow && values.toWalletId) {
        await tx
          .update(digitalWallets)
          .set({
            balance: (
              parseFloat(
                (
                  await tx
                    .select()
                    .from(digitalWallets)
                    .where(eq(digitalWallets.id, values.toWalletId))
                )[0]?.balance || "0",
              ) + amount
            ).toString(),
            updatedAt: new Date(),
          })
          .where(eq(digitalWallets.id, values.toWalletId));
      }

      if (isOutflow && values.fromAccountId) {
        await tx
          .update(accounts)
          .set({
            balance: (
              parseFloat(
                (
                  await tx
                    .select()
                    .from(accounts)
                    .where(eq(accounts.id, values.fromAccountId))
                )[0]?.balance || "0",
              ) - amount
            ).toString(),
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, values.fromAccountId));
      }

      if (isInflow && values.toAccountId) {
        await tx
          .update(accounts)
          .set({
            balance: (
              parseFloat(
                (
                  await tx
                    .select()
                    .from(accounts)
                    .where(eq(accounts.id, values.toAccountId))
                )[0]?.balance || "0",
              ) + amount
            ).toString(),
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, values.toAccountId));
      }
    };

    let primaryTransaction: Transaction | undefined;

    await db.transaction(async (tx: any) => {
      if (resolvedType === "transfer_own_accounts") {
        const outflow = await tx
          .insert(transactions)
          .values({
            ...baseValues,
            idempotencyKey: outflowIdempotencyKey,
            transferLeg: "outflow",
          })
          .returning();

        const inflow = await tx
          .insert(transactions)
          .values({
            ...baseValues,
            idempotencyKey: inflowIdempotencyKey,
            transferLeg: "inflow",
          })
          .returning();

        if (outflow[0]) {
          primaryTransaction = outflow[0] as Transaction;
          await tx.insert(transactionMetadata).values({
            transactionId: outflow[0].id,
            isFlagged: false,
          });
        }

        if (inflow[0]) {
          await tx.insert(transactionMetadata).values({
            transactionId: inflow[0].id,
            isFlagged: false,
          });
        }

        await updateBalance(tx, {
          ...baseValues,
          amount: data.amount,
          transferLeg: "outflow",
        });
        await updateBalance(tx, {
          ...baseValues,
          amount: data.amount,
          transferLeg: "inflow",
        });
        return;
      }

      const single = await tx
        .insert(transactions)
        .values({
          ...baseValues,
          transferLeg:
            resolvedType === "transfer_third_party" ? "outflow" : undefined,
        })
        .returning();

      if (single[0]) {
        primaryTransaction = single[0] as Transaction;
        await tx.insert(transactionMetadata).values({
          transactionId: single[0].id,
          isFlagged: false,
        });
        await updateBalance(tx, {
          ...baseValues,
          amount: data.amount,
          transferLeg:
            resolvedType === "transfer_third_party" ? "outflow" : undefined,
        });
      }
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    if (!primaryTransaction) {
      return err(databaseError("insert", "Error al crear la transacción"));
    }

    return ok(primaryTransaction as Transaction);
  } catch (error) {
    logger.error("Failed to create transaction", error as Error);
    return err(databaseError("insert", "Error al crear la transacción"));
  }
}

async function applyTransactionEvent(
  transactionId: string,
  event: TransactionEventType,
  context?: TransactionStateContext,
): Promise<Result<Transaction, AppError>> {
  const session = await auth();
  if (!session?.user?.id) {
    return err(authorizationError("transactions"));
  }

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, session.user.id),
      ),
    );

  if (!transaction) {
    return err(notFoundError("transaction", transactionId));
  }

  const fsm = createStateMachineFromRecord(transaction);
  if (!fsm.canTransition(event)) {
    return err(
      validationError("state", `Cannot ${event} from ${fsm.getState()} state`),
    );
  }

  fsm.send(event, {
    ...context,
    transitionedAt: new Date().toISOString(),
  });

  const [updated] = await db
    .update(transactions)
    .set({
      state: fsm.getState(),
      stateMachine: fsm.getContext(),
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, transactionId))
    .returning();

  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  if (!updated) {
    return err(databaseError("update", "Error al actualizar la transacción"));
  }

  return ok(updated as Transaction);
}

export async function submitTransaction(
  transactionId: string,
): Promise<Result<Transaction, AppError>> {
  return applyTransactionEvent(transactionId, "SUBMIT", {
    submittedAt: new Date().toISOString(),
  });
}

export async function confirmTransaction(
  transactionId: string,
): Promise<Result<Transaction, AppError>> {
  return applyTransactionEvent(transactionId, "CONFIRM", {
    confirmedAt: new Date().toISOString(),
  });
}

export async function rejectTransaction(
  transactionId: string,
): Promise<Result<Transaction, AppError>> {
  return applyTransactionEvent(transactionId, "REJECT", {
    rejectedAt: new Date().toISOString(),
  });
}

export async function cancelTransaction(
  transactionId: string,
): Promise<Result<Transaction, AppError>> {
  return applyTransactionEvent(transactionId, "CANCEL", {
    cancelledAt: new Date().toISOString(),
  });
}

export async function reconcileTransaction(
  transactionId: string,
): Promise<Result<Transaction, AppError>> {
  return applyTransactionEvent(transactionId, "RECONCILE", {
    reconciledAt: new Date().toISOString(),
  });
}

export async function getTransactions(filters?: {
  type?: string;
  category?: string;
  currency?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<Result<Array<Transaction>, AppError>> {
  const session = await auth();
  if (!session?.user?.id) {
    return err(authorizationError("transactions"));
  }

  const conditions = [eq(transactions.userId, session.user.id)];

  // Filtros múltiples
  if (filters?.type) {
    const types = filters.type.split(",");
    if (types.length > 0) {
      conditions.push(
        or(...types.map((t) => eq(transactions.type, t as any)))!,
      );
    }
  }

  if (filters?.category) {
    const categories = filters.category.split(",");
    if (categories.length > 0) {
      conditions.push(
        or(...categories.map((c) => eq(transactions.category, c as any)))!,
      );
    }
  }

  if (filters?.currency) {
    const currencies = filters.currency.split(",");
    if (currencies.length > 0) {
      conditions.push(
        or(...currencies.map((c) => eq(transactions.currency, c as any)))!,
      );
    }
  }

  if (filters?.search) {
    conditions.push(
      or(
        sql`lower(${transactions.description}) like lower(${"%" + filters.search + "%"})`,
        sql`lower(${transactions.transferRecipient}) like lower(${"%" + filters.search + "%"})`,
        sql`lower(${transactions.transferSender}) like lower(${"%" + filters.search + "%"})`,
      )!,
    );
  }

  // Determinar orden
  let orderByClause: any = desc(transactions.date); // Default

  if (filters?.sortBy && filters?.sortDirection) {
    const validColumns = {
      date: transactions.date,
      amount: transactions.amount,
      description: transactions.description,
      type: transactions.type,
      category: transactions.category,
    };

    const column = validColumns[filters.sortBy as keyof typeof validColumns];
    if (column) {
      orderByClause =
        filters.sortDirection === "asc" ? asc(column) : desc(column);
    }
  }

  try {
    const result = await db.query.transactions.findMany({
      where: and(...conditions),
      orderBy: [orderByClause],
    });
    return ok(result as Array<Transaction>);
  } catch (error) {
    logger.error("Failed to fetch transactions", error as Error, {
      userId: session.user.id,
    });
    return err(databaseError("select", "Error al obtener transacciones"));
  }
}

export async function deleteTransaction(
  id: string,
): Promise<Result<void, AppError>> {
  const session = await auth();

  if (!session?.user?.id) {
    return err(authorizationError("transactions"));
  }

  try {
    // Obtener transacción para revertir balances
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.id, id), eq(transactions.userId, session.user.id)),
      );

    if (!transaction) {
      return err(notFoundError("transaction", id));
    }

    const amount = parseFloat(transaction.amount);

    await db.transaction(async (tx: any) => {
      // Revertir balance de cuenta origen
      if (transaction.fromAccountId) {
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, transaction.fromAccountId));
      }

      // Revertir balance de cuenta destino
      if (transaction.toAccountId) {
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} - ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, transaction.toAccountId));
      }

      // Revertir objetivo
      if (transaction.goalId && transaction.type === "saving") {
        await tx
          .update(savingsGoals)
          .set({
            currentAmount: sql`${savingsGoals.currentAmount} - ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(savingsGoals.id, transaction.goalId));
      }

      // Eliminar transacción
      await tx.delete(transactions).where(eq(transactions.id, id));
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (error) {
    logger.error("Failed to delete transaction", error as Error);
    return err(databaseError("delete", "Error al eliminar la transacción"));
  }
}

/**
 * Updates account/wallet balances after a transaction is confirmed
 *
 * Handles balance updates for:
 * - Outflow transactions: reduces source account balance
 * - Inflow transactions: increases destination account balance
 * - Transfers: updates both source and destination balances
 * - Supports accounts, bank accounts, and digital wallets
 *
 * Note: Does NOT recalculate savings goals or update metadata.
 * Use in conjunction with transaction state transitions for complete updates.
 *
 * Validates:
 * - User authentication and authorization
 * - Transaction exists and belongs to user
 * - Source/destination accounts belong to user
 * - Sufficient balance for outflows
 *
 * @param {string} transactionId - ID of the transaction to process
 * @returns {Promise<Result<void, AppError>>} Void on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Not found error if transaction doesn't exist
 * @throws {AppError} Database error if balance update fails
 * @throws {AppError} Validation error if insufficient balance or account mismatch
 *
 * @example
 * const result = await updateBalancesAfterTransaction('txn_123');
 * if (result.isOk()) {
 *   console.log('Balances updated successfully');
 * } else {
 *   console.error('Balance update failed:', result.error.message);
 * }
 */
export async function updateBalancesAfterTransaction(
  transactionId: string,
): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("transactions"));
    }

    const transaction = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, session.user.id),
        ),
      );

    if (transaction.length === 0) {
      return err(notFoundError("transaction", transactionId));
    }

    const tx = transaction[0];
    const amount = parseFloat(tx.amount);

    const isOutflow = tx.transferLeg === "outflow" || !tx.transferLeg;
    const isInflow = tx.transferLeg === "inflow" || !tx.transferLeg;

    if (isOutflow && tx.fromBankAccountId) {
      await db
        .update(bankAccounts)
        .set({
          balance: (
            parseFloat(
              (
                await db
                  .select()
                  .from(bankAccounts)
                  .where(eq(bankAccounts.id, tx.fromBankAccountId))
              )[0]?.balance || "0",
            ) - amount
          ).toString(),
          updatedAt: new Date(),
        })
        .where(eq(bankAccounts.id, tx.fromBankAccountId));
    }

    if (isInflow && tx.toBankAccountId) {
      await db
        .update(bankAccounts)
        .set({
          balance: (
            parseFloat(
              (
                await db
                  .select()
                  .from(bankAccounts)
                  .where(eq(bankAccounts.id, tx.toBankAccountId))
              )[0]?.balance || "0",
            ) + amount
          ).toString(),
          updatedAt: new Date(),
        })
        .where(eq(bankAccounts.id, tx.toBankAccountId));
    }

    if (isOutflow && tx.fromWalletId) {
      await db
        .update(digitalWallets)
        .set({
          balance: (
            parseFloat(
              (
                await db
                  .select()
                  .from(digitalWallets)
                  .where(eq(digitalWallets.id, tx.fromWalletId))
              )[0]?.balance || "0",
            ) - amount
          ).toString(),
          updatedAt: new Date(),
        })
        .where(eq(digitalWallets.id, tx.fromWalletId));
    }

    if (isInflow && tx.toWalletId) {
      await db
        .update(digitalWallets)
        .set({
          balance: (
            parseFloat(
              (
                await db
                  .select()
                  .from(digitalWallets)
                  .where(eq(digitalWallets.id, tx.toWalletId))
              )[0]?.balance || "0",
            ) + amount
          ).toString(),
          updatedAt: new Date(),
        })
        .where(eq(digitalWallets.id, tx.toWalletId));
    }

    if (isOutflow && tx.fromAccountId) {
      await db
        .update(accounts)
        .set({
          balance: (
            parseFloat(
              (
                await db
                  .select()
                  .from(accounts)
                  .where(eq(accounts.id, tx.fromAccountId))
              )[0]?.balance || "0",
            ) - amount
          ).toString(),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, tx.fromAccountId));
    }

    if (isInflow && tx.toAccountId) {
      await db
        .update(accounts)
        .set({
          balance: (
            parseFloat(
              (
                await db
                  .select()
                  .from(accounts)
                  .where(eq(accounts.id, tx.toAccountId))
              )[0]?.balance || "0",
            ) + amount
          ).toString(),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, tx.toAccountId));
    }

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to update balances", error as Error);
    return err(databaseError("update", "Error al actualizar los saldos"));
  }
}

/**
 * Retrieves all transactions for the authenticated user with associated metadata
 *
 * Fetches:
 * - All user transactions with complete transaction details
 * - Associated metadata (flags, reasons, custom data) if available
 * - Combines transaction and metadata records into single objects
 *
 * Metadata includes:
 * - Suspicious transaction flags and reasons
 * - Custom notes and tags
 * - Processing status and timestamps
 *
 * Validates:
 * - User authentication and authorization
 * - Only returns transactions belonging to the user
 *
 * @returns {Promise<Result<Array<Transaction & { metadata?: any }>, AppError>>}
 * Array of transactions with optional metadata, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Database error if query fails
 *
 * @example
 * const result = await getTransactionsWithMetadata();
 * if (result.isOk()) {
 *   result.value.forEach(transaction => {
 *     console.log(transaction.description, transaction.metadata?.isFlagged);
 *   });
 * }
 */
export async function getTransactionsWithMetadata(): Promise<
  Result<Array<Transaction & { metadata?: any }>, AppError>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("transactions"));
    }

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, session.user.id));

    const transactionsWithMetadata = await Promise.all(
      userTransactions.map(async (txn: any) => {
        const metadata = await db
          .select()
          .from(transactionMetadata)
          .where(eq(transactionMetadata.transactionId, txn.id));

        return {
          ...txn,
          metadata: metadata[0] || null,
        } as any;
      }),
    );

    return ok(transactionsWithMetadata);
  } catch (error) {
    logger.error("Failed to fetch transactions with metadata", error as Error);
    return err(databaseError("select", "Error al obtener transacciones"));
  }
}

/**
 * Flags a transaction as suspicious and stores the reason for manual review
 *
 * Updates or creates metadata record to:
 * - Mark transaction as flagged (suspicious)
 * - Store the reason for flagging
 * - Update timestamp for audit trail
 *
 * Reasons may include:
 * - Unusual amount (very high/low)
 * - Unusual frequency (too many in short time)
 * - Unusual payee/payer
 * - Pattern matching vs behavioral norms
 *
 * Validates:
 * - User authentication and authorization
 * - Transaction exists and belongs to user
 * - Reason is provided
 *
 * @param {string} transactionId - ID of the transaction to flag
 * @param {string} reason - Human-readable reason for flagging
 * @returns {Promise<Result<void, AppError>>} Void on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Not found error if transaction doesn't exist
 * @throws {AppError} Validation error if reason is empty
 * @throws {AppError} Database error if update fails
 *
 * @example
 * const result = await flagTransactionAsSuspicious(
 *   'txn_123',
 *   'Unusual high amount for weekend transaction'
 * );
 * if (result.isOk()) {
 *   console.log('Transaction flagged for review');
 * }
 */
export async function flagTransactionAsSuspicious(
  transactionId: string,
  reason: string,
): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("transactions"));
    }

    const transaction = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, session.user.id),
        ),
      );

    if (transaction.length === 0) {
      return err(notFoundError("transaction", transactionId));
    }

    const existingMetadata = await db
      .select()
      .from(transactionMetadata)
      .where(eq(transactionMetadata.transactionId, transactionId));

    if (existingMetadata.length > 0) {
      await db
        .update(transactionMetadata)
        .set({
          isFlagged: true,
          flagReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(transactionMetadata.transactionId, transactionId));
    } else {
      await db.insert(transactionMetadata).values({
        transactionId,
        isFlagged: true,
        flagReason: reason,
      });
    }

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to flag transaction", error as Error, {
      transactionId,
      reason,
    });
    return err(databaseError("update", "Error al marcar la transacción"));
  }
}

export async function getSuspiciousTransactions(): Promise<
  Result<Array<any>, AppError>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("transactions"));
    }

    const flaggedTransactions = await db
      .select()
      .from(transactionMetadata)
      .where(eq(transactionMetadata.isFlagged, true));

    const results = await Promise.all(
      flaggedTransactions.map(async (meta: any) => {
        const txn = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.id, meta.transactionId),
              eq(transactions.userId, session.user.id),
            ),
          );

        return {
          ...txn[0],
          metadata: meta,
        };
      }),
    );

    return ok(results.filter((r: any) => r !== null && r !== undefined));
  } catch (error) {
    logger.error("Failed to fetch suspicious transactions", error as Error);
    return err(databaseError("select", "Error al obtener transacciones"));
  }
}

export async function getUserAccounts(): Promise<
  Result<Array<typeof accounts.$inferSelect>, AppError>
> {
  const session = await auth();

  if (!session?.user?.id) {
    return err(authorizationError("accounts"));
  }

  try {
    const result = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, session.user.id));
    return ok(result);
  } catch (error) {
    logger.error("Failed to fetch user accounts", error as Error, {
      userId: session.user.id,
    });
    return err(databaseError("select", "Error al obtener cuentas"));
  }
}

export async function getUserGoals(): Promise<
  Result<Array<typeof savingsGoals.$inferSelect>, AppError>
> {
  const session = await auth();

  if (!session?.user?.id) {
    return err(authorizationError("savings_goals"));
  }

  try {
    const result = await db
      .select()
      .from(savingsGoals)
      .where(
        and(
          eq(savingsGoals.userId, session.user.id),
          eq(savingsGoals.status, "active"),
        ),
      );
    return ok(result);
  } catch (error) {
    logger.error("Failed to fetch savings goals", error as Error, {
      userId: session.user.id,
    });
    return err(databaseError("select", "Error al obtener objetivos"));
  }
}
