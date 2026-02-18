// src/core/actions/transactions.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { transactions, accounts, savingsGoals } from "@/db/schema/finance";
import { revalidatePath } from "next/cache";
import { eq, and, desc, or, sql, asc } from "drizzle-orm";
import type { TransactionType, TransactionCategory } from "@/types";

export async function createTransaction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "No autenticado" };
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

  // Validaciones
  if (!type || !category || !amount || !description || !date) {
    return { error: "Todos los campos son requeridos" };
  }

  const numAmount = parseFloat(amount);
  if (numAmount <= 0) {
    return { error: "El monto debe ser mayor a 0" };
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
    return {
      error: "La moneda seleccionada no coincide con la cuenta origen.",
    };
  }

  if (toAccount && toAccount.currency !== currency) {
    return {
      error: "La moneda seleccionada no coincide con la cuenta destino.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      // Crear transacción
      await tx.insert(transactions).values({
        userId: session.user.id,
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
    return { success: true };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { error: "Error al crear la transacción" };
  }
}

export async function getTransactions(filters?: {
  type?: string;
  category?: string;
  currency?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}) {
  const session = await auth();
  if (!session?.user?.id) return [];

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

  return await db.query.transactions.findMany({
    where: and(...conditions),
    orderBy: [orderByClause],
  });
}

export async function deleteTransaction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "No autenticado" };
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
      return { error: "Transacción no encontrada" };
    }

    const amount = parseFloat(transaction.amount);

    await db.transaction(async (tx) => {
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
    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { error: "Error al eliminar la transacción" };
  }
}

export async function getUserAccounts() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    return await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, session.user.id));
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

export async function getUserGoals() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  try {
    return await db
      .select()
      .from(savingsGoals)
      .where(
        and(
          eq(savingsGoals.userId, session.user.id),
          eq(savingsGoals.status, "active"),
        ),
      );
  } catch (error) {
    console.error("Error fetching goals:", error);
    return [];
  }
}
