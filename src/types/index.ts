/**
 * Tipo para representar una tarjeta de pago
 */
export interface PaymentCard {
  id: number;
  bank: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holder: string;
  alias?: string;
}

/**
 * Tipo extendido para tarjeta de crédito
 */
export interface CreditCardData extends PaymentCard {
  cardNumber: string;
  cvv: string;
  type: "credit";
}

/**
 * Tipo extendido para tarjeta de débito
 */
export interface DebitCardData extends PaymentCard {
  cardNumber: string;
  type: "debit";
}

/**
 * Respuesta genérica de API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

/**
 * Filtros comunes
 */
export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ============================================
// TRANSACCIONES
// ============================================

export type TransactionType =
  | "income" // Ingreso
  | "expense" // Gasto
  | "transfer_own_accounts" // Transferencia entre mis cuentas
  | "transfer_third_party" // Transferencia a terceros
  | "withdrawal" // Retiro de efectivo
  | "deposit" // Ingreso de efectivo
  | "saving" // Ahorro a objetivo
  | "investment" // Inversión
  | "refund"; // Reembolso

export type TransactionCategory =
  // Gastos
  | "food"
  | "transportation"
  | "entertainment"
  | "health"
  | "shopping"
  | "bills"
  | "rent"
  | "utilities"
  | "subscription"
  | "insurance"
  | "taxes"

  // Ingresos
  | "salary"
  | "freelance"
  | "bonus"
  | "investment_return"
  | "passive_income"

  // Ahorro/Transferencias
  | "emergency_fund"
  | "vacation"
  | "house"
  | "car"
  | "education"
  | "retirement"

  // Otros
  | "transfer_fee"
  | "bank_fee"
  | "interest"
  | "other";

export type PaymentMethod =
  | "bank_transfer"
  | "debit_card"
  | "credit_card"
  | "cash"
  | "wallet"
  | "check"
  | "cryptocurrency"
  | "other";

export type BankAccountType =
  | "checking" // Cuenta corriente
  | "savings" // Caja de ahorro
  | "investment" // Inversión
  | "credit_card" // Tarjeta de crédito
  | "debit_card" // Tarjeta de débito
  | "money_market"; // Mercado de dinero

export type Bank =
  | "banco_nacion"
  | "banco_provincia"
  | "bbva"
  | "santander"
  | "icbc"
  | "hsbc"
  | "itau"
  | "nuevo_banco_bsa"
  | "macro"
  | "scotiabank"
  | "banco_galicia"
  | "banco_hipotecario"
  | "banco_industrial"
  | "banco_ciudad"
  | "cuenta_dni"
  | "brubank"
  | "ual"
  | "wisfy"
  | "rebanking"
  | "otro_banco";

export type WalletProvider =
  | "mercado_pago"
  | "paypal"
  | "ualá"
  | "brubank"
  | "bnext"
  | "uphold"
  | "skrill"
  | "neteller"
  | "otro_wallet";

// ============================================
// CUENTAS BANCARIAS
// ============================================
export interface BankAccount {
  id: string;
  userId: string;
  accountName: string; // "Mi caja de ahorro Santander"
  bank: Bank;
  accountType: BankAccountType;
  accountNumber: string;
  cbu?: string | null;
  alias?: string | null;
  iban?: string | null;
  currency: string;
  balance: string;
  ownerName: string;
  ownerDocument?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BILLETERAS DIGITALES
// ============================================
export interface DigitalWallet {
  id: string;
  userId: string;
  walletName: string; // "Mi Mercado Pago"
  provider: WalletProvider;
  email?: string | null;
  phoneNumber?: string | null;
  username?: string | null;
  currency: string;
  balance: string;
  linkedBankAccountId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CONTACTOS / TERCEROS
// ============================================
export interface Contact {
  id: string;
  userId: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  document?: string | null; // DNI/CUIT
  cbu?: string | null;
  alias?: string | null;
  iban?: string | null;
  bank?: Bank | null;
  accountNumber?: string | null;
  bankAccountType?: BankAccountType | null;
  isFavorite?: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactFolder {
  id: string;
  userId: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactFolderMember {
  id: string;
  folderId: string;
  contactId: string;
  createdAt: Date;
}

// ============================================
// TRANSACCIONES (Mejoradas)
// ============================================
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: string;
  currency: string;
  description: string;
  date: Date;

  // Cuentas del usuario
  fromAccountId?: string | null;
  toAccountId?: string | null;

  // Cuentas bancarias reales
  fromBankAccountId?: string | null;
  toBankAccountId?: string | null;

  // Wallets digitales
  fromWalletId?: string | null;
  toWalletId?: string | null;

  // Contactos (terceros)
  contactId?: string | null;

  // Para transferencias a terceros
  transferRecipient?: string | null;
  transferSender?: string | null;

  // Transferencias enlazadas (doble registro)
  transferGroupId?: string | null;
  transferLeg?: "outflow" | "inflow" | null;

  // Método de pago
  paymentMethod?: PaymentMethod | null;

  // Para ahorros
  goalId?: string | null;

  // Flags de detección automática
  isTransferBetweenOwnAccounts: boolean;
  isTransferToThirdParty: boolean;
  isCashWithdrawal: boolean;
  isCashDeposit: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// METADATA DE TRANSACCIONES
// ============================================
export interface TransactionMetadata {
  id: string;
  transactionId: string;
  referenceType?: string | null;
  referenceNumber?: string | null;
  merchantName?: string | null;
  merchantCategory?: string | null;
  merchantLocation?: string | null;
  receiptUrl?: string | null;
  invoiceNumber?: string | null;
  tags?: string | null; // JSON array como string
  internalNotes?: string | null;
  isReconciled: boolean;
  reconciliationDate?: Date | null;
  isFlagged: boolean;
  flagReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Cuentas/Wallets
export interface Account {
  id: string;
  userId: string;
  name: string;
  type: "cash" | "bank" | "card" | "savings" | "investment";
  balance: string;
  currency: string;
  color: string | null; // ← Cambiar de undefined a null
  icon: string | null; // ← Cambiar de undefined a null
  createdAt: Date;
  updatedAt: Date;
}

// Objetivos de ahorro
export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  description: string | null; // ← Cambiar de string a string | null
  targetAmount: string;
  currentAmount: string;
  deadline: Date | null; // ← Ya está bien
  priority: "low" | "medium" | "high";
  status: "active" | "completed" | "paused";
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de tema
export type {
  Theme,
  ThemeContextType,
  CSSThemeVariables,
  ThemeOption,
  ThemeConfig,
} from "./theme";
