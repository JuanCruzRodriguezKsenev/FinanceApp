import { CreditCardData, DebitCardData } from "@/types";

/**
 * Tipo para tarjeta enriquecida con información adicional
 */
export type EnrichedCard = (CreditCardData | DebitCardData) & {
  selected?: boolean;
};

/**
 * Campos disponibles para filtrar tarjetas
 */
export const CARD_FILTER_FIELDS = [
  {
    key: "bank" as const,
    label: "Bank",
  },
  {
    key: "type" as const,
    label: "Type",
    options: ["Credit Card", "Debit Card"],
  },
];

/**
 * Opciones de ordenamiento para tarjetas
 */
export const CARD_SORT_OPTIONS = [
  {
    key: "bank" as const,
    label: "Bank (A-Z)",
  },
  {
    key: "holder" as const,
    label: "Holder (A-Z)",
  },
];
