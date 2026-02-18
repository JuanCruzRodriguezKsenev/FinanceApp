/**
 * Opciones centralizadas para selects y dropdowns
 * Evita hardcoding repetido en múltiples componentes
 */

export const BANK_OPTIONS = [
  { value: "banco_nacion", label: "Banco Nación" },
  { value: "banco_provincia", label: "Banco Provincia" },
  { value: "bbva", label: "BBVA" },
  { value: "santander", label: "Santander" },
  { value: "icbc", label: "ICBC" },
  { value: "hsbc", label: "HSBC" },
  { value: "itau", label: "Itaú" },
  { value: "nuevo_banco_bsa", label: "Nuevo Banco BSA" },
  { value: "macro", label: "Macro" },
  { value: "scotiabank", label: "Scotiabank" },
  { value: "banco_galicia", label: "Banco Galicia" },
  { value: "brubank", label: "Brubank" },
  { value: "ual", label: "Ualá" },
  { value: "wisfy", label: "Wisfy" },
  { value: "otro_banco", label: "Otro banco" },
] as const;

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "checking", label: "Cuenta Corriente" },
  { value: "savings", label: "Caja de Ahorro" },
  { value: "investment", label: "Inversión" },
  { value: "credit_card", label: "Tarjeta de Crédito" },
  { value: "debit_card", label: "Tarjeta de Débito" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "ARS", label: "Peso Argentino (ARS)" },
  { value: "USD", label: "Dólar Estadounidense (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "BRL", label: "Real Brasileño (BRL)" },
  { value: "CLP", label: "Peso Chileno (CLP)" },
  { value: "MXN", label: "Peso Mexicano (MXN)" },
  { value: "UYU", label: "Peso Uruguayo (UYU)" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "debit_card", label: "Tarjeta de Débito" },
  { value: "credit_card", label: "Tarjeta de Crédito" },
  { value: "bank_transfer", label: "Transferencia Bancaria" },
  { value: "check", label: "Cheque" },
  { value: "wallet", label: "Billetera Digital" },
  { value: "cryptocurrency", label: "Criptomoneda" },
] as const;

/**
 * Helper para obtener label de opción por valor
 */
export function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((opt) => opt.value === value)?.label ?? value;
}

/**
 * Helper para filtrar opciones
 */
export function filterOptions(
  options: readonly { value: string; label: string }[],
  searchTerm: string,
): typeof options {
  const term = searchTerm.toLowerCase();
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(term) ||
      opt.value.toLowerCase().includes(term),
  ) as typeof options;
}
