/**
 * Labels centralizados para categorías y tipos de transacciones
 * Evita duplicación entre TransactionForm, TransactionRow, etc.
 */

export const TRANSACTION_LABELS = {
  typeNames: {
    income: "Ingreso",
    expense: "Gasto",
    transfer_own_accounts: "Mi Transferencia",
    transfer_third_party: "Pago a Tercero",
    withdrawal: "Retiro",
    deposit: "Depósito",
    saving: "Ahorro",
    investment: "Inversión",
    refund: "Reembolso",
  },

  categories: {
    // Expense categories
    food: { emoji: "🍔", label: "Comida" },
    transportation: { emoji: "🚗", label: "Transporte" },
    entertainment: { emoji: "🎬", label: "Ocio" },
    health: { emoji: "💊", label: "Salud" },
    shopping: { emoji: "🛍️", label: "Compras" },
    bills: { emoji: "📄", label: "Facturas" },
    rent: { emoji: "🏠", label: "Alquiler" },
    utilities: { emoji: "💡", label: "Servicios" },
    subscription: { emoji: "🔔", label: "Suscripción" },
    insurance: { emoji: "🛡️", label: "Seguros" },
    taxes: { emoji: "📋", label: "Impuestos" },

    // Income categories
    salary: { emoji: "💰", label: "Salario" },
    freelance: { emoji: "💻", label: "Freelance" },
    bonus: { emoji: "🎁", label: "Bonificación" },
    investment_return: { emoji: "📈", label: "Rendimiento" },
    passive_income: { emoji: "🌱", label: "Ingreso Pasivo" },

    // Savings categories
    emergency_fund: { emoji: "🆘", label: "Fondo Emergencia" },
    vacation: { emoji: "✈️", label: "Vacaciones" },
    house: { emoji: "🏠", label: "Casa" },
    car: { emoji: "🚗", label: "Auto" },
    education: { emoji: "📚", label: "Educación" },
    retirement: { emoji: "👴", label: "Jubilación" },

    // Default/Other
    other: { emoji: "📦", label: "Otro" },
  } as const,
} as const;

export type CategoryKey = keyof typeof TRANSACTION_LABELS.categories;
export type TransactionTypeKey = keyof typeof TRANSACTION_LABELS.typeNames;

/**
 * Obtener emoji + label de una categoría
 */
export function getCategoryLabel(category: CategoryKey | string): string {
  const cat = TRANSACTION_LABELS.categories[category as CategoryKey];
  if (!cat) {
    return `📦 ${category}`;
  }
  return `${cat.emoji} ${cat.label}`;
}

/**
 * Obtener solo el label de una categoría
 */
export function getCategoryName(category: CategoryKey | string): string {
  const cat = TRANSACTION_LABELS.categories[category as CategoryKey];
  return cat?.label ?? category;
}

/**
 * Obtener solo el emoji de una categoría
 */
export function getCategoryEmoji(category: CategoryKey | string): string {
  const cat = TRANSACTION_LABELS.categories[category as CategoryKey];
  return cat?.emoji ?? "📦";
}

/**
 * Obtener nombre del tipo de transacción
 */
export function getTransactionTypeName(
  type: TransactionTypeKey | string,
): string {
  return TRANSACTION_LABELS.typeNames[type as TransactionTypeKey] ?? type;
}

/**
 * Obtener categorías filtradas por tipo de transacción
 * (si se escogen qué categorías van con cada tipo)
 */
export const CATEGORIES_BY_TYPE = {
  expense: [
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
    "other",
  ] as const,
  income: [
    "salary",
    "freelance",
    "bonus",
    "investment_return",
    "passive_income",
    "other",
  ] as const,
  transfer_own_accounts: ["other"] as const,
  transfer_third_party: ["other"] as const,
  withdrawal: ["other"] as const,
  deposit: ["other"] as const,
  saving: [
    "emergency_fund",
    "vacation",
    "house",
    "car",
    "education",
    "retirement",
    "other",
  ] as const,
  investment: ["investment_return", "other"] as const,
  refund: ["other"] as const,
} as const;

/**
 * Obtener categorías válidas para un tipo de transacción
 */
export function getCategoriesForType(type: string): CategoryKey[] {
  const categoryMap = CATEGORIES_BY_TYPE;
  const key = type as keyof typeof categoryMap;

  if (!key || !categoryMap[key]) {
    return [];
  }

  // Convert readonly array tuple to mutable array
  const categories = categoryMap[key];
  return Array.isArray(categories)
    ? [...(categories as unknown as CategoryKey[])]
    : [];
}

/**
 * Obtener opciones de selector para categorías (con emoji + label)
 */
export function getCategorySelectOptions(type?: string) {
  const categories = type
    ? getCategoriesForType(type)
    : (Object.keys(TRANSACTION_LABELS.categories) as CategoryKey[]);

  return categories.map((key) => ({
    value: key,
    label: getCategoryLabel(key),
    emoji: getCategoryEmoji(key),
  }));
}
