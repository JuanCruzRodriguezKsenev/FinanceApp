/**
 * Server Actions para gestión de billeteras digitales
 */

"use server";

import { db } from "@/db";
import { digitalWallets } from "@/db/schema/finance";
import { auth } from "@/lib/auth";
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
}): Promise<{ success: boolean; data?: DigitalWallet; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const newWallet = await db
      .insert(digitalWallets)
      .values({
        userId: session.user.id,
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

    return { success: true, data: newWallet[0] as any };
  } catch (error) {
    console.error("Error creating digital wallet:", error);
    return {
      success: false,
      error: "Error al crear la billetera digital",
    };
  }
}

/**
 * Obtener todas las billeteras digitales del usuario
 */
export async function getDigitalWallets(): Promise<{
  success: boolean;
  data?: DigitalWallet[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const wallets = await db
      .select()
      .from(digitalWallets)
      .where(eq(digitalWallets.userId, session.user.id));

    return { success: true, data: wallets as DigitalWallet[] };
  } catch (error) {
    console.error("Error fetching digital wallets:", error);
    return { success: false, error: "Error al obtener billeteras digitales" };
  }
}

/**
 * Actualizar una billetera digital
 */
export async function updateDigitalWallet(
  walletId: string,
  data: Partial<DigitalWallet>,
): Promise<{ success: boolean; data?: DigitalWallet; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Billetera no encontrada" };
    }

    const updated = await db
      .update(digitalWallets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(digitalWallets.id, walletId))
      .returning();

    return { success: true, data: updated[0] as any };
  } catch (error) {
    console.error("Error updating digital wallet:", error);
    return {
      success: false,
      error: "Error al actualizar la billetera digital",
    };
  }
}

/**
 * Eliminar una billetera digital
 */
export async function deleteDigitalWallet(
  walletId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Billetera no encontrada" };
    }

    await db.delete(digitalWallets).where(eq(digitalWallets.id, walletId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting digital wallet:", error);
    return {
      success: false,
      error: "Error al eliminar la billetera digital",
    };
  }
}

/**
 * Actualizar saldo de una billetera digital
 */
export async function updateWalletBalance(
  walletId: string,
  newBalance: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
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
      return { success: false, error: "Billetera no encontrada" };
    }

    await db
      .update(digitalWallets)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(digitalWallets.id, walletId));

    return { success: true };
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    return {
      success: false,
      error: "Error al actualizar el saldo",
    };
  }
}
