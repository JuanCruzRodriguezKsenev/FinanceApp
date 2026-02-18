/**
 * Server Actions para gestión de cuentas bancarias
 */

"use server";

import { db } from "@/db";
import { bankAccounts, transactions } from "@/db/schema/finance";
import { users } from "@/db/schema/auth";
import { auth } from "@/lib/auth";
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
}): Promise<{ success: boolean; data?: BankAccount; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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

    return { success: true, data: newAccount[0] as any };
  } catch (error) {
    console.error("Error creating bank account:", error);
    return {
      success: false,
      error: "Error al crear la cuenta bancaria",
    };
  }
}

/**
 * Obtener todas las cuentas bancarias del usuario
 */
export async function getBankAccounts(): Promise<{
  success: boolean;
  data?: BankAccount[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, session.user.id));

    return { success: true, data: accounts as BankAccount[] };
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return { success: false, error: "Error al obtener cuentas bancarias" };
  }
}

/**
 * Actualizar una cuenta bancaria
 */
export async function updateBankAccount(
  accountId: string,
  data: Partial<BankAccount>,
): Promise<{ success: boolean; data?: BankAccount; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Cuenta no encontrada" };
    }

    const updated = await db
      .update(bankAccounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(bankAccounts.id, accountId))
      .returning();

    return { success: true, data: updated[0] as any };
  } catch (error) {
    console.error("Error updating bank account:", error);
    return {
      success: false,
      error: "Error al actualizar la cuenta bancaria",
    };
  }
}

/**
 * Eliminar una cuenta bancaria
 */
export async function deleteBankAccount(
  accountId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Cuenta no encontrada" };
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
      return {
        success: false,
        error: "No se puede eliminar una cuenta con transacciones asociadas",
      };
    }

    await db.delete(bankAccounts).where(eq(bankAccounts.id, accountId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return {
      success: false,
      error: "Error al eliminar la cuenta bancaria",
    };
  }
}

/**
 * Actualizar saldo de una cuenta bancaria
 */
export async function updateBankAccountBalance(
  accountId: string,
  newBalance: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Cuenta no encontrada" };
    }

    await db
      .update(bankAccounts)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(bankAccounts.id, accountId));

    return { success: true };
  } catch (error) {
    console.error("Error updating balance:", error);
    return {
      success: false,
      error: "Error al actualizar el saldo",
    };
  }
}

/**
 * Buscar cuenta por CBU o Alias
 */
export async function searchBankAccountByCBUOrAlias(
  cbuOrAlias: string,
): Promise<{ success: boolean; data?: BankAccount; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Cuenta no encontrada" };
    }

    return { success: true, data: account[0] as any };
  } catch (error) {
    console.error("Error searching bank account:", error);
    return {
      success: false,
      error: "Error al buscar la cuenta",
    };
  }
}
