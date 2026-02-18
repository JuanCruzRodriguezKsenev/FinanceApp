/**
 * Server Actions mejoradas para transacciones con detección automática
 */

"use server";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import {
  transactions,
  bankAccounts,
  digitalWallets,
  accounts,
  transactionMetadata,
} from "@/db/schema/finance";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  detectTransactionType,
  detectCategoryFromDescription,
  detectSuspiciousActivity,
} from "@/lib/transaction-detector";
import type {
  Transaction,
  TransactionType,
  TransactionCategory,
  PaymentMethod,
} from "@/types";

/**
 * Crear una transacción con detección automática de tipo
 */
export async function createTransactionWithAutoDetection(data: {
  amount: number;
  currency?: string;
  description: string;
  date: Date;
  paymentMethod?: PaymentMethod;
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
}): Promise<{ success: boolean; data?: Transaction; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    // Obtener IDs de cuentas del usuario para comparación
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

    const userBankAccountIds = userBankAccounts.map((a) => a.id);
    const userWalletIds = userWallets.map((w) => w.id);
    const userAccountIds = userAccounts.map((a) => a.id);

    // Detección automática de tipo
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

    // Detección automática de categoría
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
      return {
        success: false,
        error:
          "La moneda seleccionada no coincide con la cuenta origen o destino.",
      };
    }
    const transferGroupId =
      resolvedType === "transfer_own_accounts" ||
      resolvedType === "transfer_third_party"
        ? randomUUID()
        : undefined;

    const baseValues = {
      userId: session.user.id,
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

    const updateBalance = async (
      tx: typeof db,
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

    await db.transaction(async (tx) => {
      if (resolvedType === "transfer_own_accounts") {
        const outflow = await tx
          .insert(transactions)
          .values({
            ...baseValues,
            transferLeg: "outflow",
          })
          .returning();

        const inflow = await tx
          .insert(transactions)
          .values({
            ...baseValues,
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

    return { success: true, data: primaryTransaction as any };
  } catch (error) {
    logger.error("Failed to create transaction", error as Error);
    return {
      success: false,
      error: "Error al crear la transacción",
    };
  }
}

/**
 * Actualizar saldos después de una transacción
 */
export async function updateBalancesAfterTransaction(
  transactionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    // Obtener transacción
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
      return { success: false, error: "Transacción no encontrada" };
    }

    const tx = transaction[0];
    const amount = parseFloat(tx.amount);

    const isOutflow = tx.transferLeg === "outflow" || !tx.transferLeg;
    const isInflow = tx.transferLeg === "inflow" || !tx.transferLeg;

    // Actualizar balance de cuenta bancaria origen
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

    // Actualizar balance de cuenta bancaria destino
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

    // Actualizar balance de wallet origen
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

    // Actualizar balance de wallet destino
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

    // Actualizar balance de cuenta general origen
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

    // Actualizar balance de cuenta general destino
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

    return { success: true };
  } catch (error) {
    logger.error("Failed to update balances", error as Error);
    return {
      success: false,
      error: "Error al actualizar los saldos",
    };
  }
}

/**
 * Obtener transacciones con metadata
 */
export async function getTransactionsWithMetadata(): Promise<
  Array<Transaction & { metadata?: any }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, session.user.id));

    // Obtener metadata para cada transacción
    const transactionsWithMetadata = await Promise.all(
      userTransactions.map(async (txn) => {
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

    return transactionsWithMetadata;
  } catch (error) {
    logger.error("Failed to fetch transactions with metadata", error as Error);
    return [];
  }
}

/**
 * Marcar transacción como sospechosa
 */
export async function flagTransactionAsSuspicious(
  transactionId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    // Verificar que es del usuario
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
      return { success: false, error: "Transacción no encontrada" };
    }

    // Actualizar o crear metadata
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

    return { success: true };
  } catch (error) {
    logger.error("Failed to flag transaction", error as Error, {
      transactionId,
      reason,
    });
    return {
      success: false,
      error: "Error al marcar la transacción",
    };
  }
}

/**
 * Obtener transacciones sospechosas
 */
export async function getSuspiciousTransactions(): Promise<Array<any>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const flaggedTransactions = await db
      .select()
      .from(transactionMetadata)
      .where(eq(transactionMetadata.isFlagged, true));

    // Obtener las transacciones completas
    const results = await Promise.all(
      flaggedTransactions.map(async (meta) => {
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

    return results.filter((r) => r !== null && r !== undefined);
  } catch (error) {
    logger.error("Failed to fetch suspicious transactions", error as Error);
    return [];
  }
}
