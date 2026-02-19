/**
 * Server Actions para gestión de cuentas bancarias
 */

"use server";

import { and,eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { bankAccounts, transactions } from "@/db/schema/finance";
import { auth } from "@/lib/auth";
import { createIdempotencyKey } from "@/lib/idempotency";
import { logger } from "@/lib/logger";
import {
  type AppError,
  authorizationError,
  databaseError,
  err,
  notFoundError,
  ok,
  type Result,
  validationError,
} from "@/lib/result";
import type { BankAccount } from "@/types";

/**
 * Crear una nueva cuenta bancaria
 */
/**
 * Creates a new bank account for the authenticated user
 *
 * Stores bank account information including:
 * - Account identification (number, CBU, IBAN, alias)
 * - Bank details (bank name, account type)
 * - Owner information (name, document ID)
 * - Current balance and currency
 * - Optional notes for manual record keeping
 *
 * Uses idempotency keys to prevent duplicate accounts on retry.
 * Returns existing account if identical data already exists.
 *
 * Validates:
 * - User authentication and authorization
 * - Account number format and uniqueness per user
 * - CBU format (optional, validated if provided)
 * - IBAN format (optional, validated if provided)
 * - Currency code validity
 * - Balance is numeric and non-negative
 *
 * @param {Object} data - Bank account creation data
 * @param {string} data.accountName - Friendly name for the account (e.g., "Mi Cuenta Sueldo")
 * @param {string} data.bank - Bank name (e.g., "Banco Galicia", "BBVA")
 * @param {string} data.accountType - Account type (e.g., "checking", "savings", "money_market")
 * @param {string} data.accountNumber - Account number (bank-specific format)
 * @param {string} [data.cbu] - CBU number (Argentina, 22 digits)
 * @param {string} [data.alias] - CBU alias for transfers (e.g., "alias.example")
 * @param {string} [data.iban] - IBAN (international transfers)
 * @param {string} data.currency - Currency code (e.g., "ARS", "USD", "EUR")
 * @param {string} data.balance - Current account balance
 * @param {string} data.ownerName - Account owner full name
 * @param {string} [data.ownerDocument] - Owner document ID (DNI, RUC, etc.)
 * @param {string} [data.notes] - Additional notes or metadata
 * @param {string} [data.idempotencyKey] - Optional custom idempotency key
 * @returns {Promise<Result<BankAccount, AppError>>} Created bank account object on success
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Validation error if data is invalid
 * @throws {AppError} Database error if creation fails
 *
 * @example
 * const result = await createBankAccount({
 *   accountName: 'Mi Cuenta Principal',
 *   bank: 'Banco Galicia',
 *   accountType: 'checking',
 *   accountNumber: '1234567890',
 *   cbu: '0170123456789012345678',
 *   currency: 'ARS',
 *   balance: '5000',
 *   ownerName: 'Juan Pérez'
 * });
 * if (result.isOk()) {
 *   console.log('Account created:', result.value.id);
 * }
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
  idempotencyKey?: string;
}): Promise<Result<BankAccount, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("bank_accounts"));
    }

    const idempotencyKey = createIdempotencyKey(
      "bank-accounts:create",
      session.user.id,
      [
        data.accountName,
        data.bank,
        data.accountType,
        data.accountNumber,
        data.cbu,
        data.alias,
        data.iban,
        data.currency,
        data.ownerName,
        data.ownerDocument,
      ],
      data.idempotencyKey,
    );

    const existingAccount = await db.query.bankAccounts.findFirst({
      where: and(
        eq(bankAccounts.userId, session.user.id),
        eq(bankAccounts.idempotencyKey, idempotencyKey),
      ),
    });

    if (existingAccount) {
      return ok(existingAccount as BankAccount);
    }

    const newAccount = await db
      .insert(bankAccounts)
      .values({
        userId: session.user.id,
        idempotencyKey,
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
 * Retrieves all bank accounts for the authenticated user
 *
 * Fetches complete bank account records with all stored details.
 * Does not include related transaction history or balance history.
 *
 * Validates:
 * - User authentication and authorization
 * - Only returns accounts belonging to the user
 *
 * @returns {Promise<Result<BankAccount[], AppError>>}
 * Array of bank accounts on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Database error if query fails
 *
 * @example
 * const result = await getBankAccounts();
 * if (result.isOk()) {
 *   result.value.forEach(account => {
 *     console.log(`${account.accountName}: ${account.balance} ${account.currency}`);
 *   });
 * }
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
 * Updates an existing bank account with new information
 *
 * Allows partial updates of bank account fields:
 * - Account identification (CBU, IBAN, alias)
 * - Account name and notes
 * - Balance (though should usually be updated via transactions)
 * - Owner information
 *
 * Validates:
 * - User authentication and authorization
 * - Account exists and belongs to authenticated user
 * - Updated data is valid (format, uniqueness constraints)
 *
 * @param {string} accountId - ID of the bank account to update
 * @param {Partial<BankAccount>} data - Fields to update (partial update)
 * @returns {Promise<Result<BankAccount, AppError>>} Updated account object on success
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Not found error if account doesn't exist
 * @throws {AppError} Validation error if updated data is invalid
 * @throws {AppError} Database error if update fails
 *
 * @example
 * const result = await updateBankAccount('account_123', {
 *   alias: 'newalias',
 *   notes: 'Updated notes'
 * });
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
/**
 * Deletes a bank account and all associated transaction records
 *
 * Permanently removes:
 * - Bank account record
 * - All related transactions (cascade delete)
 * - All transaction metadata
 * - Cannot be undone
 *
 * WARNING: This is irreversible. All transaction history will be lost.
 * Consider archiving inactive accounts instead of deleting.
 *
 * Validates:
 * - User authentication and authorization
 * - Account exists and belongs to authenticated user
 *
 * @param {string} accountId - ID of the bank account to delete
 * @returns {Promise<Result<void, AppError>>} Void on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Not found error if account doesn't exist
 * @throws {AppError} Database error if deletion fails
 *
 * @example
 * const result = await deleteBankAccount('account_123');
 * if (result.isOk()) {
 *   console.log('Account deleted permanently');
 * }
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
/**
 * Updates the current balance of a bank account
 *
 * Sets the account balance directly to the provided value.
 * Typically used during account sync or when manually adjusting balance.
 *
 * Note: This bypasses transaction logging. For transaction-based updates,
 * use transaction creation/state transitions which automatically update balances.
 *
 * Validates:
 * - User authentication and authorization
 * - Account exists and belongs to authenticated user
 * - New balance is numeric and non-negative
 *
 * @param {string} accountId - ID of the bank account
 * @param {string} newBalance - New balance value (numeric string)
 * @returns {Promise<Result<void, AppError>>} Void on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Not found error if account doesn't exist
 * @throws {AppError} Validation error if balance format is invalid
 * @throws {AppError} Database error if update fails
 *
 * @example
 * const result = await updateBankAccountBalance('account_123', '10000');
 * if (result.isOk()) {
 *   console.log('Balance updated to 10000');
 * }
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
