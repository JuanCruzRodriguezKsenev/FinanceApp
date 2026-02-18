// src/db/schema/finance.ts
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS - Extended
// ============================================

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income", // Ingreso
  "expense", // Gasto
  "transfer_own_accounts", // Transferencia entre mis cuentas
  "transfer_third_party", // Transferencia a terceros
  "withdrawal", // Retiro de efectivo
  "deposit", // Ingreso de efectivo
  "saving", // Ahorro
  "investment", // Inversión
  "refund", // Reembolso
]);

export const transactionCategoryEnum = pgEnum("transaction_category", [
  // Gastos
  "food",
  "transportation",
  "entertainment",
  "health",
  "shopping",
  "bills",
  "rent",
  "utilities",
  "subscription",
  "insurance",
  "taxes",
  // Ingresos
  "salary",
  "freelance",
  "bonus",
  "investment_return",
  "passive_income",
  // Ahorro
  "emergency_fund",
  "vacation",
  "house",
  "car",
  "education",
  "retirement",
  // Otros
  "transfer_fee",
  "bank_fee",
  "interest",
  "other",
]);

export const bankAccountTypeEnum = pgEnum("bank_account_type", [
  "checking", // Cuenta corriente
  "savings", // Caja de ahorro
  "investment", // Inversión
  "credit_card", // Tarjeta de crédito
  "debit_card", // Tarjeta de débito
  "money_market", // Mercado de dinero
]);

export const bankEnum = pgEnum("bank", [
  "banco_nacion",
  "banco_provincia",
  "bbva",
  "santander",
  "icbc",
  "hsbc",
  "itau",
  "nuevo_banco_bsa",
  "macro",
  "scotiabank",
  "banco_galicia",
  "banco_hipotecario",
  "banco_industrial",
  "banco_ciudad",
  "cuenta_dni",
  "brubank",
  "ual",
  "wisfy",
  "rebanking",
  "otro_banco",
]);

export const walletProviderEnum = pgEnum("wallet_provider", [
  "mercado_pago",
  "paypal",
  "ualá",
  "brubank",
  "bnext",
  "uphold",
  "skrill",
  "neteller",
  "otro_wallet",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "debit_card",
  "credit_card",
  "cash",
  "wallet",
  "check",
  "cryptocurrency",
  "other",
]);

export const transactionReferenceTypeEnum = pgEnum(
  "transaction_reference_type",
  [
    "cbu_transfer",
    "alias_transfer",
    "merchant",
    "atm_withdrawal",
    "check_number",
    "reference_number",
    "invoice",
  ],
);

export const transferLegEnum = pgEnum("transfer_leg", ["outflow", "inflow"]);

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "paused",
]);

export const goalPriorityEnum = pgEnum("goal_priority", [
  "low",
  "medium",
  "high",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "bank",
  "wallet",
  "cash",
  "card",
]);

// ============================================
// CUENTAS BANCARIAS REALES
// ============================================
export const bankAccounts = pgTable("bank_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountName: text("account_name").notNull(), // Ej: "Mi caja de ahorro Santander"
  bank: bankEnum("bank").notNull(),
  accountType: bankAccountTypeEnum("account_type").notNull(),
  accountNumber: text("account_number").notNull(), // Número de cuenta
  cbu: text("cbu").unique(), // CBU (CBU argentino)
  alias: text("alias").unique(), // Alias (ej: pepe.rodriguez)
  iban: text("iban").unique(), // IBAN (para cuentas internacionales)
  currency: text("currency").notNull().default("ARS"),
  balance: numeric("balance", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  ownerName: text("owner_name").notNull(), // Nombre del titular
  ownerDocument: text("owner_document"), // DNI/CUIT del titular
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"), // Notas personales
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// BILLETERAS DIGITALES / WALLETS
// ============================================
export const digitalWallets = pgTable("digital_wallet", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletName: text("wallet_name").notNull(), // Ej: "Mi Mercado Pago"
  provider: walletProviderEnum("provider").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  username: text("username"),
  currency: text("currency").notNull().default("ARS"),
  balance: numeric("balance", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  linkedBankAccountId: uuid("linked_bank_account_id").references(
    () => bankAccounts.id,
    { onDelete: "set null" },
  ), // Cuenta bancaria vinculada
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// CONTACTOS / TERCEROS
// ============================================
export const contacts = pgTable("contact", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  email: text("email"),
  phoneNumber: text("phone_number"),
  document: text("document"), // DNI/CUIT
  cbu: text("cbu"),
  alias: text("alias"),
  iban: text("iban"),
  bank: bankEnum("bank"),
  accountNumber: text("account_number"),
  bankAccountType: bankAccountTypeEnum("bank_account_type"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactFolders = pgTable("contact_folder", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactFolderMembers = pgTable("contact_folder_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id")
    .notNull()
    .references(() => contactFolders.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// CUENTAS GENERALES (Simplificadas)
// ============================================
export const accounts = pgTable("financial_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  currency: text("currency").notNull().default("ARS"),
  color: text("color"),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// OBJETIVOS DE AHORRO
// ============================================
export const savingsGoals = pgTable("savings_goal", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  deadline: timestamp("deadline"),
  priority: goalPriorityEnum("priority").notNull().default("medium"),
  status: goalStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// TRANSACCIONES (Mejoradas)
// ============================================
export const transactions = pgTable("financial_transaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Tipo y categoría
  type: transactionTypeEnum("type").notNull(),
  category: transactionCategoryEnum("category").notNull(),

  // Monto y descripción
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ARS"),
  description: text("description").notNull(),
  date: timestamp("date").notNull().defaultNow(),

  // Cuentas del usuario
  fromAccountId: uuid("from_account_id").references(() => accounts.id),
  toAccountId: uuid("to_account_id").references(() => accounts.id),

  // Cuentas bancarias reales
  fromBankAccountId: uuid("from_bank_account_id").references(
    () => bankAccounts.id,
    { onDelete: "set null" },
  ),
  toBankAccountId: uuid("to_bank_account_id").references(
    () => bankAccounts.id,
    { onDelete: "set null" },
  ),

  // Wallets digitales
  fromWalletId: uuid("from_wallet_id").references(() => digitalWallets.id, {
    onDelete: "set null",
  }),
  toWalletId: uuid("to_wallet_id").references(() => digitalWallets.id, {
    onDelete: "set null",
  }),

  // Contactos (terceros)
  contactId: uuid("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),

  // Para transferencias a terceros
  transferRecipient: text("transfer_recipient"),
  transferSender: text("transfer_sender"),

  // Transferencias enlazadas (doble registro)
  transferGroupId: uuid("transfer_group_id"),
  transferLeg: transferLegEnum("transfer_leg"),

  // Método de pago
  paymentMethod: paymentMethodEnum("payment_method"),

  // Para ahorros
  goalId: uuid("goal_id").references(() => savingsGoals.id),

  // Flags de detección automática
  isTransferBetweenOwnAccounts: boolean(
    "is_transfer_between_own_accounts",
  ).default(false),
  isTransferToThirdParty: boolean("is_transfer_to_third_party").default(false),
  isCashWithdrawal: boolean("is_cash_withdrawal").default(false),
  isCashDeposit: boolean("is_cash_deposit").default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// METADATA DE TRANSACCIONES
// ============================================
export const transactionMetadata = pgTable("transaction_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .notNull()
    .unique()
    .references(() => transactions.id, { onDelete: "cascade" }),

  // Referencia
  referenceType: transactionReferenceTypeEnum("reference_type"),
  referenceNumber: text("reference_number"), // Número de comprobante, referencia, etc.

  // Detalles del comercio
  merchantName: text("merchant_name"),
  merchantCategory: text("merchant_category"),
  merchantLocation: text("merchant_location"),

  // Detalles del comprobante
  receiptUrl: text("receipt_url"),
  invoiceNumber: text("invoice_number"),

  // Tags personalizados
  tags: text("tags"), // JSON array como string

  // Notas
  internalNotes: text("internal_notes"),

  // Reconciliación
  isReconciled: boolean("is_reconciled").default(false),
  reconciliationDate: timestamp("reconciliation_date"),

  // Flags
  isFlagged: boolean("is_flagged").default(false),
  flagReason: text("flag_reason"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// RELACIONES
// ============================================

export const bankAccountsRelations = relations(
  bankAccounts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [bankAccounts.userId],
      references: [users.id],
    }),
    linkedWallet: one(digitalWallets, {
      fields: [bankAccounts.id],
      references: [digitalWallets.linkedBankAccountId],
    }),
    transactionsFrom: many(transactions, { relationName: "from_bank_account" }),
    transactionsTo: many(transactions, { relationName: "to_bank_account" }),
  }),
);

export const digitalWalletsRelations = relations(
  digitalWallets,
  ({ one, many }) => ({
    user: one(users, {
      fields: [digitalWallets.userId],
      references: [users.id],
    }),
    linkedBankAccount: one(bankAccounts, {
      fields: [digitalWallets.linkedBankAccountId],
      references: [bankAccounts.id],
    }),
    transactionsFrom: many(transactions, { relationName: "from_wallet" }),
    transactionsTo: many(transactions, { relationName: "to_wallet" }),
  }),
);

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  folderMemberships: many(contactFolderMembers),
}));

export const contactFoldersRelations = relations(
  contactFolders,
  ({ one, many }) => ({
    user: one(users, {
      fields: [contactFolders.userId],
      references: [users.id],
    }),
    members: many(contactFolderMembers),
  }),
);

export const contactFolderMembersRelations = relations(
  contactFolderMembers,
  ({ one }) => ({
    folder: one(contactFolders, {
      fields: [contactFolderMembers.folderId],
      references: [contactFolders.id],
    }),
    contact: one(contacts, {
      fields: [contactFolderMembers.contactId],
      references: [contacts.id],
    }),
  }),
);

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactionsFrom: many(transactions, { relationName: "from_account" }),
  transactionsTo: many(transactions, { relationName: "to_account" }),
}));

export const savingsGoalsRelations = relations(
  savingsGoals,
  ({ one, many }) => ({
    user: one(users, {
      fields: [savingsGoals.userId],
      references: [users.id],
    }),
    transactions: many(transactions),
  }),
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  fromAccount: one(accounts, {
    fields: [transactions.fromAccountId],
    references: [accounts.id],
    relationName: "from_account",
  }),
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
    relationName: "to_account",
  }),
  fromBankAccount: one(bankAccounts, {
    fields: [transactions.fromBankAccountId],
    references: [bankAccounts.id],
    relationName: "from_bank_account",
  }),
  toBankAccount: one(bankAccounts, {
    fields: [transactions.toBankAccountId],
    references: [bankAccounts.id],
    relationName: "to_bank_account",
  }),
  fromWallet: one(digitalWallets, {
    fields: [transactions.fromWalletId],
    references: [digitalWallets.id],
    relationName: "from_wallet",
  }),
  toWallet: one(digitalWallets, {
    fields: [transactions.toWalletId],
    references: [digitalWallets.id],
    relationName: "to_wallet",
  }),
  contact: one(contacts, {
    fields: [transactions.contactId],
    references: [contacts.id],
  }),
  goal: one(savingsGoals, {
    fields: [transactions.goalId],
    references: [savingsGoals.id],
  }),
  metadata: one(transactionMetadata, {
    fields: [transactions.id],
    references: [transactionMetadata.transactionId],
  }),
}));

export const transactionMetadataRelations = relations(
  transactionMetadata,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionMetadata.transactionId],
      references: [transactions.id],
    }),
  }),
);
