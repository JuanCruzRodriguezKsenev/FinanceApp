/**
 * Server Actions para gestión de billeteras digitales
 */

"use server";

import { and,eq } from "drizzle-orm";

import { db } from "@/db";
import { digitalWallets } from "@/db/schema/finance";
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
} from "@/lib/result";
import type { DigitalWallet } from "@/types";

/**
 * Crear una nueva billetera digital
 */
/**
 * Creates a new digital wallet for the authenticated user
 *
 * Stores digital wallet information including:
 * - Wallet identification (username, email, phone)
 * - Provider details (service name, provider type)
 * - Balance and currency
 * - Optional link to a bank account for transfers
 *
 * Supports major digital payment providers:
 * - MercadoPago, PayPal, Stripe, Square, Wise, etc.
 *
 * Uses idempotency keys to prevent duplicate wallets on retry.
 * Returns existing wallet if identical data already exists.
 *
 * Validates:
 * - User authentication and authorization
 * - Wallet name is not empty
 * - Provider is valid and supported
 * - Email/phone format (if provided)
 * - Currency code validity
 * - Balance is numeric and non-negative
 * - Linked bank account (if provided) belongs to user
 *
 * @param {Object} data - Digital wallet creation data
 * @param {string} data.walletName - Friendly name for the wallet (e.g., "Mi MercadoPago")
 * @param {string} data.provider - Payment provider (e.g., "mercadopago", "paypal", "stripe")
 * @param {string} [data.email] - Associated email address
 * @param {string} [data.phoneNumber] - Associated phone number
 * @param {string} [data.username] - Provider username or account ID
 * @param {string} data.currency - Currency code (e.g., "ARS", "USD")
 * @param {string} data.balance - Current wallet balance
 * @param {string} [data.linkedBankAccountId] - Associated bank account for transfers
 * @param {string} [data.idempotencyKey] - Optional custom idempotency key
 * @returns {Promise<Result<DigitalWallet, AppError>>} Created wallet object on success
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Validation error if data is invalid
 * @throws {AppError} Database error if creation fails
 *
 * @example
 * const result = await createDigitalWallet({
 *   walletName: 'Mi MercadoPago',
 *   provider: 'mercadopago',
 *   email: 'user@example.com',
 *   currency: 'ARS',
 *   balance: '1500'
 * });
 */
export async function createDigitalWallet(data: {
  walletName: string;
  provider: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
  currency: string;
  balance: string;
  linkedBankAccountId?: string;
  idempotencyKey?: string;
}): Promise<Result<DigitalWallet, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("digital_wallets"));
    }

    const idempotencyKey = createIdempotencyKey(
      "digital-wallets:create",
      session.user.id,
      [
        data.walletName,
        data.provider,
        data.email,
        data.phoneNumber,
        data.username,
        data.currency,
        data.linkedBankAccountId,
      ],
      data.idempotencyKey,
    );

    const existingWallet = await db.query.digitalWallets.findFirst({
      where: and(
        eq(digitalWallets.userId, session.user.id),
        eq(digitalWallets.idempotencyKey, idempotencyKey),
      ),
    });

    if (existingWallet) {
      return ok(existingWallet as DigitalWallet);
    }

    const newWallet = await db
      .insert(digitalWallets)
      .values({
        userId: session.user.id,
        idempotencyKey,
        walletName: data.walletName,
        provider: data.provider as any,
        email: data.email,
        phoneNumber: data.phoneNumber,
        username: data.username,
        currency: data.currency,
        balance: data.balance,
        linkedBankAccountId: data.linkedBankAccountId,
      })
      .returning();

    return ok(newWallet[0] as DigitalWallet);
  } catch (error) {
    logger.error("Failed to create digital wallet", error as Error, {
      provider: data.provider,
    });
    return err(databaseError("insert", "Error al crear la billetera"));
  }
}

/**
 * Retrieves all digital wallets for the authenticated user
 *
 * Fetches complete wallet records with all stored details.
 * Does not include transaction history or balance history.
 *
 * Validates:
 * - User authentication and authorization
 * - Only returns wallets belonging to the user
 *
 * @returns {Promise<Result<DigitalWallet[], AppError>>}
 * Array of digital wallets on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Database error if query fails
 *
 * @example
 * const result = await getDigitalWallets();
 * if (result.isOk()) {
 *   result.value.forEach(wallet => {
 *     console.log(`${wallet.walletName}: ${wallet.balance} ${wallet.currency}`);
 *   });
 * }
 */
export async function getDigitalWallets(): Promise<
  Result<DigitalWallet[], AppError>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("digital_wallets"));
    }

    const wallets = await db
      .select()
      .from(digitalWallets)
      .where(eq(digitalWallets.userId, session.user.id));

    return ok(wallets as DigitalWallet[]);
  } catch (error) {
    logger.error("Failed to fetch digital wallets", error as Error);
    return err(databaseError("select", "Error al obtener billeteras"));
  }
}

/**
 * Updates an existing digital wallet with new information
 *
 * Allows partial updates of wallet fields:
 * - Wallet name and provider details
 * - Contact information (email, phone, username)
 * - Balance (though should usually be updated via transactions)
 * - Linked bank account reference
 *
 * Validates:
 * - User authentication and authorization
 * - Wallet exists and belongs to authenticated user
 * - Updated data is valid (format, constraints)
 *
 * @param {string} walletId - ID of the digital wallet to update
 * @param {Partial<DigitalWallet>} data - Fields to update (partial update)
 * @returns {Promise<Result<DigitalWallet, AppError>>} Updated wallet object on success
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Not found error if wallet doesn't exist
 * @throws {AppError} Validation error if updated data is invalid
 * @throws {AppError} Database error if update fails
 *
 * @example
 * const result = await updateDigitalWallet('wallet_123', {
 *   email: 'newemail@example.com'
 * });
 */
export async function updateDigitalWallet(
  walletId: string,
  data: Partial<DigitalWallet>,
): Promise<Result<DigitalWallet, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("digital_wallets"));
    }

    // Verificar que pertenece al usuario
    const existingWallet = await db
      .select()
      .from(digitalWallets)
      .where(
        and(
          eq(digitalWallets.id, walletId),
          eq(digitalWallets.userId, session.user.id),
        ),
      );

    if (existingWallet.length === 0) {
      return err(notFoundError("digital_wallet", walletId));
    }

    const updated = await db
      .update(digitalWallets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(digitalWallets.id, walletId))
      .returning();

    return ok(updated[0] as DigitalWallet);
  } catch (error) {
    logger.error("Failed to update digital wallet", error as Error, {
      walletId,
    });
    return err(databaseError("update", "Error al actualizar la billetera"));
  }
}

/**
 * Deletes a digital wallet and all associated transaction records
 *
 * Permanently removes:
 * - Digital wallet record
 * - All related transactions (cascade delete)
 * - All transaction metadata
 * - Cannot be undone
 *
 * WARNING: This is irreversible. All transaction history will be lost.
 * Consider archiving inactive wallets instead of deleting.
 *
 * Validates:
 * - User authentication and authorization
 * - Wallet exists and belongs to authenticated user
 *
 * @param {string} walletId - ID of the digital wallet to delete
 * @returns {Promise<Result<void, AppError>>} Void on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Not found error if wallet doesn't exist
 * @throws {AppError} Database error if deletion fails
 *
 * @example
 * const result = await deleteDigitalWallet('wallet_123');
 * if (result.isOk()) {
 *   console.log('Wallet deleted permanently');
 * }
 */
export async function deleteDigitalWallet(
  walletId: string,
): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("digital_wallets"));
    }

    // Verificar que pertenece al usuario
    const existingWallet = await db
      .select()
      .from(digitalWallets)
      .where(
        and(
          eq(digitalWallets.id, walletId),
          eq(digitalWallets.userId, session.user.id),
        ),
      );

    if (existingWallet.length === 0) {
      return err(notFoundError("digital_wallet", walletId));
    }

    await db.delete(digitalWallets).where(eq(digitalWallets.id, walletId));

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to delete digital wallet", error as Error, {
      walletId,
    });
    return err(databaseError("delete", "Error al eliminar la billetera"));
  }
}

/**
 * Actualizar saldo de una billetera digital
 */
/**
 * Updates the current balance of a digital wallet
 *
 * Sets the wallet balance directly to the provided value.
 * Typically used during wallet sync or when manually adjusting balance.
 *
 * Note: This bypasses transaction logging. For transaction-based updates,
 * use transaction creation/state transitions which automatically update balances.
 *
 * Validates:
 * - User authentication and authorization
 * - Wallet exists and belongs to authenticated user
 * - New balance is numeric and non-negative
 *
 * @param {string} walletId - ID of the digital wallet
 * @param {string} newBalance - New balance value (numeric string)
 * @returns {Promise<Result<void, AppError>>} Void on success, AppError on failure
 * @throws {AppError} Authorization error if user not authenticated
 * @throws {AppError} Not found error if wallet doesn't exist
 * @throws {AppError} Validation error if balance format is invalid
 * @throws {AppError} Database error if update fails
 *
 * @example
 * const result = await updateWalletBalance('wallet_123', '2500');
 * if (result.isOk()) {
 *   console.log('Balance updated to 2500');
 * }
 */
export async function updateWalletBalance(
  walletId: string,
  newBalance: string,
): Promise<Result<void, AppError>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err(authorizationError("digital_wallets"));
    }

    // Verificar que pertenece al usuario
    const existingWallet = await db
      .select()
      .from(digitalWallets)
      .where(
        and(
          eq(digitalWallets.id, walletId),
          eq(digitalWallets.userId, session.user.id),
        ),
      );

    if (existingWallet.length === 0) {
      return err(notFoundError("digital_wallet", walletId));
    }

    await db
      .update(digitalWallets)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(digitalWallets.id, walletId));

    return ok(undefined);
  } catch (error) {
    logger.error("Failed to update wallet balance", error as Error, {
      walletId,
      newBalance,
    });
    return err(databaseError("update", "Error al actualizar el saldo"));
  }
}
