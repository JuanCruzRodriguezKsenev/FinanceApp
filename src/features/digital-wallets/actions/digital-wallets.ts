/**
 * Server Actions para gestión de billeteras digitales
 */

"use server";

import { db } from "@/db";
import { digitalWallets } from "@/db/schema/finance";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createIdempotencyKey } from "@/lib/idempotency";
import {
  ok,
  err,
  authorizationError,
  databaseError,
  notFoundError,
  type Result,
  type AppError,
} from "@/lib/result";
import { eq, and } from "drizzle-orm";
import type { DigitalWallet } from "@/types";

/**
 * Crear una nueva billetera digital
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
 * Obtener todas las billeteras digitales del usuario
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
 * Actualizar una billetera digital
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
 * Eliminar una billetera digital
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
