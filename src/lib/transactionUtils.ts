/**
 * Utilidades para cálculos de transacciones
 * Evita repetición de filter + reduce en múltiples componentes
 */

import type { Transaction } from "@/types";

/**
 * Calcula el total de transacciones de un tipo específico
 * @param transactions - Array de transacciones
 * @param type - Tipo de transacción a filtrar
 * @returns Total sumado
 */
export function calculateTotalByType(
  transactions: Transaction[],
  type: string,
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

/**
 * Calcula múltiples totales a la vez
 * @param transactions - Array de transacciones
 * @param types - Tipos a calcular
 * @returns Objeto con totales por tipo
 */
export function calculateTotals(
  transactions: Transaction[],
  types: string[],
): Record<string, number> {
  return types.reduce(
    (acc, type) => {
      acc[type] = calculateTotalByType(transactions, type);
      return acc;
    },
    {} as Record<string, number>,
  );
}

/**
 * Calcula balance (ingresos - gastos)
 */
export function calculateBalance(transactions: Transaction[]): number {
  const income = calculateTotalByType(transactions, "income");
  const expenses = calculateTotalByType(transactions, "expense");
  return income - expenses;
}

/**
 * Obtiene estadísticas de transacciones
 */
export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  balance: number;
}

export function getTransactionStats(
  transactions: Transaction[],
): TransactionStats {
  const totalIncome = calculateTotalByType(transactions, "income");
  const totalExpenses = calculateTotalByType(transactions, "expense");
  const totalSavings = calculateTotalByType(transactions, "saving");
  const balance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    balance,
  };
}
