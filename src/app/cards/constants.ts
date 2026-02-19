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
    name: "bank",
    label: "Bank",
    type: "select" as const,
  },
  {
    name: "type",
    label: "Type",
    type: "select" as const,
    options: [
      { value: "credit", label: "Credit Card" },
      { value: "debit", label: "Debit Card" },
    ],
  },
];

/**
 * Opciones de ordenamiento para tarjetas
 */
export const CARD_SORT_OPTIONS = [
  {
    value: "bank",
    label: "Bank (A-Z)",
    direction: "asc" as const,
  },
  {
    value: "holder",
    label: "Holder (A-Z)",
    direction: "asc" as const,
  },
];
