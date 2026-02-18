/**
 * Configuración centralizada de tipos y opciones de transacciones
 * SSOT (Single Source of Truth) para evitar duplicación
 */

import type { TransactionType } from "@/types";

export const TRANSACTION_TYPE_CONFIG = [
  { type: "expense" as const, icon: "💸", label: "Gasto" },
  { type: "income" as const, icon: "💰", label: "Ingreso" },
  { type: "transfer_own_accounts" as const, icon: "🔄", label: "Mi Transf." },
  { type: "transfer_third_party" as const, icon: "💸", label: "Terceros" },
  { type: "withdrawal" as const, icon: "🏦", label: "Retiro" },
  { type: "deposit" as const, icon: "💵", label: "Depósito" },
  { type: "saving" as const, icon: "🎯", label: "Ahorro" },
  { type: "investment" as const, icon: "📈", label: "Inversión" },
  { type: "refund" as const, icon: "↩️", label: "Reembolso" },
] as const;

export type ValidTransactionType =
  (typeof TRANSACTION_TYPE_CONFIG)[number]["type"];

/**
 * Obtener configuración de un tipo de transacción específico
 */
export function getTransactionTypeConfig(type: TransactionType) {
  return TRANSACTION_TYPE_CONFIG.find((config) => config.type === type);
}

/**
 * Obtener todas las opciones para select/dropdown
 */
export const TRANSACTION_TYPE_OPTIONS = TRANSACTION_TYPE_CONFIG.map(
  ({ type, label }) => ({
    value: type,
    label,
  }),
);

/**
 * Mapa de iconos por tipo de transacción
 */
export const TRANSACTION_TYPE_ICONS: Record<TransactionType, string> =
  TRANSACTION_TYPE_CONFIG.reduce(
    (acc, { type, icon }) => {
      acc[type] = icon;
      return acc;
    },
    {} as Record<TransactionType, string>,
  );

/**
 * Mapa de etiquetas por tipo de transacción
 */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> =
  TRANSACTION_TYPE_CONFIG.reduce(
    (acc, { type, label }) => {
      acc[type] = label;
      return acc;
    },
    {} as Record<TransactionType, string>,
  );
