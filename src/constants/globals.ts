// src/constants/globals.ts

/**
 * CONSTANTES GLOBALES DE LA APLICACIÓN
 * Reutilizables en todos los componentes
 */

// ==================== VARIANTES DE BOTONES ====================
export const BUTTON_VARIANTS = {
  primary: "primary",
  secondary: "secondary",
  outline: "outline",
  danger: "danger",
  ghost: "ghost",
} as const;

export type ButtonVariant =
  (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];

// ==================== TAMAÑOS ====================
export const SIZES = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
} as const;

export type Size = (typeof SIZES)[keyof typeof SIZES];

// ==================== COLORES ====================
export const COLORS = {
  primary: "#3b82f6",
  secondary: "#6b7280",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#0ea5e9",
  light: "#f3f4f6",
  dark: "#1f2937",
} as const;

// ==================== ESPACIADOS ====================
export const SPACING = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  xxl: "3rem",
} as const;

// ==================== Z-INDEX ====================
export const Z_INDEX = {
  dropdown: 1000,
  dialog: 1050,
  popover: 1100,
  tooltip: 1200,
  notification: 1300,
} as const;

// ==================== ANIMACIONES ====================
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
} as const;

// ==================== BREAKPOINTS ====================
export const BREAKPOINTS = {
  mobile: "320px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1440px",
  ultraWide: "1920px",
} as const;

// ==================== MENSAJES ====================
export const MESSAGES = {
  loading: "Cargando...",
  error: "Algo salió mal",
  success: "Operación exitosa",
  confirm: "¿Estás seguro?",
  delete: "Esta acción no se puede deshacer",
  noData: "No hay datos disponibles",
  noResults: "No se encontraron resultados",
  required: "Este campo es requerido",
  invalidEmail: "Email inválido",
  passwordMismatch: "Las contraseñas no coinciden",
} as const;

// ==================== VALIDACIONES ====================
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-()]{10,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  url: /^https?:\/\/.+/,
} as const;

// ==================== PÁGINAS/RUTAS ====================
export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
  },
  payments: {
    list: "/payments",
    detail: (id: string) => `/payments/${id}`,
    create: "/payments/create",
    edit: (id: string) => `/payments/${id}/edit`,
  },
} as const;

// ==================== LÍMITES ====================
export const LIMITS = {
  widget: {
    minWidth: 1,
    maxWidth: 3,
    resizeThreshold: 100,
  },
  file: {
    maxSize: 5 * 1024 * 1024,
    maxSizeLabel: "5MB",
  },
  input: {
    minLength: 2,
    maxLength: 255,
  },
  textarea: {
    minLength: 5,
    maxLength: 1000,
  },
} as const;

// ==================== TIPOS DE TARJETAS ====================
export const CARD_TYPES = {
  credit: "credit",
  debit: "debit",
} as const;

export type CardType = (typeof CARD_TYPES)[keyof typeof CARD_TYPES];

// ==================== BANCOS COMUNES ====================
export const BANKS = [
  { value: "bbva", label: "BBVA" },
  { value: "santander", label: "Santander" },
  { value: "caixabank", label: "CaixaBank" },
  { value: "sabadell", label: "Sabadell" },
  { value: "ing", label: "ING" },
  { value: "openbank", label: "Openbank" },
  { value: "revolut", label: "Revolut" },
  { value: "n26", label: "N26" },
] as const;

// ==================== CRITERIOS DE ORDENAMIENTO ====================
export const SORT_DIRECTIONS = {
  asc: "asc",
  desc: "desc",
} as const;

export type SortDirection =
  (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS];

// ==================== TIPOS DE TRANSACCIONES ====================
export const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
  SAVING: "saving",
  INVESTMENT: "investment",
} as const;

export type TransactionType =
  (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

// ==================== CATEGORÍAS DE TRANSACCIONES ====================
export const TRANSACTION_CATEGORIES = {
  // Gastos
  FOOD: "food",
  TRANSPORTATION: "transportation",
  ENTERTAINMENT: "entertainment",
  HEALTH: "health",
  SHOPPING: "shopping",
  BILLS: "bills",
  RENT: "rent",
  UTILITIES: "utilities",

  // Ingresos
  SALARY: "salary",
  FREELANCE: "freelance",
  BONUS: "bonus",
  INVESTMENT_RETURN: "investment_return",

  // Ahorro
  EMERGENCY_FUND: "emergency_fund",
  VACATION: "vacation",
  HOUSE: "house",
  CAR: "car",
  EDUCATION: "education",
  RETIREMENT: "retirement",

  // Otros
  OTHER: "other",
} as const;

export type TransactionCategory =
  (typeof TRANSACTION_CATEGORIES)[keyof typeof TRANSACTION_CATEGORIES];
