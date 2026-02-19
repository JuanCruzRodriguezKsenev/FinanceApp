/**
 * Transaction Type Detector
 * Detecta automáticamente el tipo de transacción basándose en los datos
 */

import type { PaymentMethod,TransactionType } from "@/types";

export interface TransactionDetectionInput {
  fromAccountId?: string;
  toAccountId?: string;
  fromBankAccountId?: string;
  toBankAccountId?: string;
  fromWalletId?: string;
  toWalletId?: string;
  contactId?: string;
  paymentMethod?: PaymentMethod;
  amount: number;
  description: string;
  userAccountIds?: string[]; // IDs de cuentas generales del usuario
  userBankAccountIds?: string[]; // IDs de cuentas bancarias del usuario
  userWalletIds?: string[]; // IDs de wallets del usuario
}

export interface DetectionResult {
  type: TransactionType;
  isTransferBetweenOwnAccounts: boolean;
  isTransferToThirdParty: boolean;
  isCashWithdrawal: boolean;
  isCashDeposit: boolean;
  confidence: "high" | "medium" | "low";
}

/**
 * Detecta automáticamente el tipo de transacción
 */
export function detectTransactionType(
  input: TransactionDetectionInput,
): DetectionResult {
  const {
    fromAccountId,
    toAccountId,
    fromBankAccountId,
    toBankAccountId,
    fromWalletId,
    toWalletId,
    contactId,
    paymentMethod,
    amount,
    description,
    userAccountIds = [],
    userBankAccountIds = [],
    userWalletIds = [],
  } = input;

  let type: TransactionType = "expense";
  let isTransferBetweenOwnAccounts = false;
  let isTransferToThirdParty = false;
  let isCashWithdrawal = false;
  let isCashDeposit = false;
  let confidence: "high" | "medium" | "low" = "medium";

  // 1. DETECCIÓN: Transferencia entre mis propias cuentas
  if (fromAccountId && toAccountId) {
    const isFromMine = userAccountIds.includes(fromAccountId);
    const isToMine = userAccountIds.includes(toAccountId);

    if (isFromMine && isToMine) {
      type = "transfer_own_accounts";
      isTransferBetweenOwnAccounts = true;
      confidence = "high";
      return {
        type,
        isTransferBetweenOwnAccounts,
        isTransferToThirdParty,
        isCashWithdrawal,
        isCashDeposit,
        confidence,
      };
    }
  }

  if (fromBankAccountId && toBankAccountId) {
    const isFromMine = userBankAccountIds.includes(fromBankAccountId);
    const isToMine = userBankAccountIds.includes(toBankAccountId);

    if (isFromMine && isToMine) {
      type = "transfer_own_accounts";
      isTransferBetweenOwnAccounts = true;
      confidence = "high";
      return {
        type,
        isTransferBetweenOwnAccounts,
        isTransferToThirdParty,
        isCashWithdrawal,
        isCashDeposit,
        confidence,
      };
    }
  }

  // Entre wallets del usuario
  if (fromWalletId && toWalletId) {
    const isFromMine = userWalletIds.includes(fromWalletId);
    const isToMine = userWalletIds.includes(toWalletId);

    if (isFromMine && isToMine) {
      type = "transfer_own_accounts";
      isTransferBetweenOwnAccounts = true;
      confidence = "high";
      return {
        type,
        isTransferBetweenOwnAccounts,
        isTransferToThirdParty,
        isCashWithdrawal,
        isCashDeposit,
        confidence,
      };
    }
  }

  // 2. DETECCIÓN: Retiro de efectivo (ATM)
  if (
    paymentMethod === "cash" &&
    (fromBankAccountId || fromWalletId || fromAccountId) &&
    !toBankAccountId &&
    !toWalletId &&
    !toAccountId
  ) {
    type = "withdrawal";
    isCashWithdrawal = true;
    confidence = "high";
    return {
      type,
      isTransferBetweenOwnAccounts,
      isTransferToThirdParty,
      isCashWithdrawal,
      isCashDeposit,
      confidence,
    };
  }

  // 3. DETECCIÓN: Ingreso de efectivo
  if (
    paymentMethod === "cash" &&
    !fromBankAccountId &&
    !fromWalletId &&
    !fromAccountId &&
    (toBankAccountId || toWalletId || toAccountId)
  ) {
    type = "deposit";
    isCashDeposit = true;
    confidence = "high";
    return {
      type,
      isTransferBetweenOwnAccounts,
      isTransferToThirdParty,
      isCashWithdrawal,
      isCashDeposit,
      confidence,
    };
  }

  // 4. DETECCIÓN: Transferencia a terceros
  if (
    (fromBankAccountId && toBankAccountId && !isTransferBetweenOwnAccounts) ||
    (fromWalletId && !toWalletId) ||
    (fromBankAccountId && !toBankAccountId) ||
    (fromAccountId && !toAccountId) ||
    !!contactId ||
    description.toLowerCase().includes("transfer") ||
    description.toLowerCase().includes("pago") ||
    description.toLowerCase().includes("envío")
  ) {
    // Verificar si es a tercero
    const isFromMine =
      (!fromBankAccountId || userBankAccountIds.includes(fromBankAccountId)) &&
      (!fromWalletId || userWalletIds.includes(fromWalletId)) &&
      (!fromAccountId || userAccountIds.includes(fromAccountId));
    const isToMine =
      (!toBankAccountId || userBankAccountIds.includes(toBankAccountId)) &&
      (!toWalletId || userWalletIds.includes(toWalletId)) &&
      (!toAccountId || userAccountIds.includes(toAccountId));

    if (isFromMine && !isToMine) {
      type = "transfer_third_party";
      isTransferToThirdParty = true;
      confidence = "high";
      return {
        type,
        isTransferBetweenOwnAccounts,
        isTransferToThirdParty,
        isCashWithdrawal,
        isCashDeposit,
        confidence,
      };
    }
  }

  // 5. DETECCIÓN: Ingreso (Income)
  if (
    amount > 0 &&
    !fromBankAccountId &&
    !fromWalletId &&
    (description.toLowerCase().includes("salary") ||
      description.toLowerCase().includes("ingreso") ||
      description.toLowerCase().includes("pago recibido") ||
      description.toLowerCase().includes("freelance") ||
      description.toLowerCase().includes("bonus"))
  ) {
    type = "income";
    confidence = "high";
    return {
      type,
      isTransferBetweenOwnAccounts,
      isTransferToThirdParty,
      isCashWithdrawal,
      isCashDeposit,
      confidence,
    };
  }

  // 6. Defaults: Si es negativo es gasto, si es positivo es ingreso
  if (
    (fromBankAccountId || fromWalletId || fromAccountId) &&
    !toBankAccountId &&
    !toWalletId &&
    !toAccountId
  ) {
    type = "expense";
  } else if (
    amount > 0 &&
    !fromBankAccountId &&
    !fromWalletId &&
    !fromAccountId
  ) {
    type = "income";
  }

  return {
    type,
    isTransferBetweenOwnAccounts,
    isTransferToThirdParty,
    isCashWithdrawal,
    isCashDeposit,
    confidence,
  };
}

/**
 * Detecta palabras clave para categorización automática
 */
export function detectCategoryFromDescription(
  description: string,
): string | null {
  const lowerDesc = description.toLowerCase();

  // Comida
  if (
    lowerDesc.includes("restaurant") ||
    lowerDesc.includes("café") ||
    lowerDesc.includes("pizzeria") ||
    lowerDesc.includes("burger") ||
    lowerDesc.includes("food") ||
    lowerDesc.includes("mercado") ||
    lowerDesc.includes("supermercado")
  ) {
    return "food";
  }

  // Transporte
  if (
    lowerDesc.includes("uber") ||
    lowerDesc.includes("taxi") ||
    lowerDesc.includes("colectivo") ||
    lowerDesc.includes("subte") ||
    lowerDesc.includes("transporte") ||
    lowerDesc.includes("combustible") ||
    lowerDesc.includes("nafta") ||
    lowerDesc.includes("estacionamiento")
  ) {
    return "transportation";
  }

  // Servicios
  if (
    lowerDesc.includes("internet") ||
    lowerDesc.includes("electricidad") ||
    lowerDesc.includes("agua") ||
    lowerDesc.includes("gas") ||
    lowerDesc.includes("teléfono") ||
    lowerDesc.includes("utilitie")
  ) {
    return "utilities";
  }

  // Salud
  if (
    lowerDesc.includes("farmacia") ||
    lowerDesc.includes("doctor") ||
    lowerDesc.includes("médico") ||
    lowerDesc.includes("hospital") ||
    lowerDesc.includes("salud") ||
    lowerDesc.includes("health")
  ) {
    return "health";
  }

  // Entretenimiento
  if (
    lowerDesc.includes("cinema") ||
    lowerDesc.includes("cine") ||
    lowerDesc.includes("spotify") ||
    lowerDesc.includes("netflix") ||
    lowerDesc.includes("steam") ||
    lowerDesc.includes("game")
  ) {
    return "entertainment";
  }

  // Compras
  if (
    lowerDesc.includes("amazon") ||
    lowerDesc.includes("mercadolibre") ||
    lowerDesc.includes("shein") ||
    lowerDesc.includes("shopping")
  ) {
    return "shopping";
  }

  // Alquiler
  if (
    lowerDesc.includes("rent") ||
    lowerDesc.includes("alquiler") ||
    lowerDesc.includes("inmobiliario")
  ) {
    return "rent";
  }

  // Impuestos
  if (lowerDesc.includes("impuesto") || lowerDesc.includes("tax")) {
    return "taxes";
  }

  // Suscripciones
  if (lowerDesc.includes("subscription") || lowerDesc.includes("suscripción")) {
    return "subscription";
  }

  return null;
}

/**
 * Detecta si la transacción es sospechosa
 */
export function detectSuspiciousActivity(
  input: TransactionDetectionInput & {
    previousTransactions?: Array<{
      amount: number;
      date: Date;
    }>;
    userAverageAmount?: number;
  },
): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const { amount, previousTransactions = [], userAverageAmount = 0 } = input;

  // Monto muy alto comparado al promedio
  if (userAverageAmount > 0 && Math.abs(amount) > userAverageAmount * 5) {
    reasons.push("Monto significativamente mayor al promedio histórico");
  }

  // Múltiples transacciones sospechosas en corto tiempo
  if (previousTransactions && previousTransactions.length > 0) {
    const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = previousTransactions.filter(
      (t) => t.date > lastDay,
    ).length;

    if (recentCount > 10) {
      reasons.push("Muchas transacciones en las últimas 24 horas");
    }
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}
