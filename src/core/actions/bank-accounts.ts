/**
 * Server Actions para gestión de cuentas bancarias
 */

"use server";

import { db } from "@/db";
import { bankAccounts, transactions } from "@/db/schema/finance";
import { users } from "@/db/schema/auth";
import { auth } from "@/lib/auth";
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
import { eq, and } from "drizzle-orm";
import type { BankAccount } from "@/types";

/**
 * Crear una nueva cuenta bancaria
 */
export async function createBankAccount(data: {
  accountName: string;
  bank: string;
  accountType: string;
  accountNumber: string;
  cbu?: string;
  alias?: string;
  iban?: string;
  currency: string;
  balance: string;
  ownerName: string;
  ownerDocument?: string;
  notes?: string;
}): Promise<Result<BankAccount, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("bank_accounts"));
    }

    const newAccount = await db
      .insert(bankAccounts)
      .values({
        userId: session.user.id,
        accountName: data.accountName,
        bank: data.bank as any,
        accountType: data.accountType as any,
        accountNumber: data.accountNumber,
        cbu: data.cbu,
        alias: data.alias,
        iban: data.iban,
        currency: data.currency,
        balance: data.balance,
        ownerName: data.ownerName,
        ownerDocument: data.ownerDocument,
        notes: data.notes,
      })
      .returning();

    return ok(newAccount[0] as BankAccount);
  } catch (error) {
    logger.error("Failed to create bank account", error as Error, {
      bank: data.bank,
      accountType: data.accountType,
    });
    return err(databaseError("insert", "Error al crear la cuenta bancaria"));
  }
}

/**
 * Obtener todas las cuentas bancarias del usuario
 */
export async function getBankAccounts(): Promise<
  Result<BankAccount[], AppError>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("bank_accounts"));
    }

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, session.user.id));

    return ok(accounts as BankAccount[]);
  } catch (error) {
    logger.error("Failed to fetch bank accounts", error as Error);
    return err(databaseError("select", "Error al obtener cuentas bancarias"));
  }
}

/**
 * Actualizar una cuenta bancaria
 */
export async function updateBankAccount(
  accountId: string,
  data: Partial<BankAccount>,
): Promise<Result<BankAccount, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("bank_accounts"));
    }

    // Verificar que pertenece al usuario
    const existingAccount = await db
      .select()
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.id, accountId),
          eq(bankAccounts.userId, session.user.id),
        ),
      );

    if (existingAccount.length === 0) {
      return err(notFoundError("bank_account", accountId));
    }

    const updated = await db
      .update(bankAccounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(bankAccounts.id, accountId))
      .returning();

    return ok(updated[0] as BankAccount);
  } catch (error) {
    logger.error("Failed to update bank account", error as Error, {
      accountId,
    });
    return err(databaseError("update", "Error al actualizar la cuenta"));
  }
}

/**
 * Eliminar una cuenta bancaria
 */
export async function deleteBankAccount(
  accountId: string,
): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("bank_accounts"));
    }

    // Verificar que pertenece al usuario
    const existingAccount = await db
      .select()
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.id, accountId),
          eq(bankAccounts.userId, session.user.id),
        ),
      );

    if (existingAccount.length === 0) {
      return err(notFoundError("bank_account", accountId));
    }

    // Verificar que no tenga transacciones asociadas
    const associatedTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, session.user.id),
          // Verificar en ambas direcciones
          eq(transactions.fromBankAccountId, accountId),
        ),
      );

    if (associatedTransactions.length > 0) {
      return err(
        validationError(
          "bank_account",
          "No se puede eliminar una cuenta con transacciones asociadas",
        ),
      );
    }

    await db.delete(bankAccounts).where(eq(bankAccounts.id, accountId));

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to delete bank account", error as Error, {
      accountId,
    });
    return err(databaseError("delete", "Error al eliminar la cuenta"));
  }
}

/**
 * Actualizar saldo de una cuenta bancaria
 */
export async function updateBankAccountBalance(
  accountId: string,
  newBalance: string,
): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("bank_accounts"));
    }

    // Verificar que pertenece al usuario
    const existingAccount = await db
      .select()
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.id, accountId),
          eq(bankAccounts.userId, session.user.id),
        ),
      );

    if (existingAccount.length === 0) {
      return err(notFoundError("bank_account", accountId));
    }

    await db
      .update(bankAccounts)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(bankAccounts.id, accountId));

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to update bank account balance", error as Error, {
      accountId,
      newBalance,
    });
    return err(databaseError("update", "Error al actualizar el saldo"));
  }
}

/**
 * Buscar cuenta por CBU o Alias
 */
export async function searchBankAccountByCBUOrAlias(
  cbuOrAlias: string,
): Promise<Result<BankAccount, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("bank_accounts"));
    }

    const account = await db
      .select()
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.userId, session.user.id),
          eq(bankAccounts.cbu || bankAccounts.alias, cbuOrAlias),
        ),
      );

    if (account.length === 0) {
      return err(notFoundError("bank_account", cbuOrAlias));
    }

    return ok(account[0] as BankAccount);
  } catch (error) {
    logger.error("Failed to search bank account", error as Error, {
      cbuOrAlias,
    });
    return err(databaseError("select", "Error al buscar la cuenta"));
  }
}
