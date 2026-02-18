// src/components/transactions/TransactionsFilter.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Filter, {
  FilterFieldDef,
  SortOptionDef,
} from "@/components/ui/Filter/Filter";
import { SortConfig } from "@/hooks/useDataFilters";
import { CURRENCY_OPTIONS } from "@/constants/selectOptions";

// Mapeo de valores internos a etiquetas visuales
const TYPE_OPTIONS = [
  { value: "income", label: "💰 Ingresos" },
  { value: "expense", label: "💸 Gastos" },
  { value: "transfer_own_accounts", label: "🔄 Entre mis cuentas" },
  { value: "transfer_third_party", label: "👤 A terceros" },
  { value: "deposit", label: "💵 Depósito" },
  { value: "withdrawal", label: "🏧 Retiro" },
  { value: "saving", label: "🎯 Ahorros" },
  { value: "investment", label: "📈 Inversiones" },
  { value: "refund", label: "↩️ Reembolso" },
];

const CATEGORY_OPTIONS = [
  { value: "food", label: "🍔 Comida" },
  { value: "transportation", label: "🚗 Transporte" },
  { value: "entertainment", label: "🎬 Entretenimiento" },
  { value: "health", label: "💊 Salud" },
  { value: "shopping", label: "🛍️ Compras" },
  { value: "bills", label: "📄 Facturas" },
  { value: "rent", label: "🏠 Alquiler" },
  { value: "utilities", label: "💡 Servicios" },
  { value: "subscription", label: "🔔 Suscripción" },
  { value: "insurance", label: "🛡️ Seguros" },
  { value: "taxes", label: "📋 Impuestos" },
  { value: "salary", label: "💰 Salario" },
  { value: "freelance", label: "💻 Freelance" },
  { value: "bonus", label: "🎁 Bonificación" },
  { value: "investment_return", label: "📈 Rendimiento" },
  { value: "passive_income", label: "🌱 Ingreso Pasivo" },
  { value: "emergency_fund", label: "🆘 Fondo emergencia" },
  { value: "vacation", label: "✈️ Vacaciones" },
  { value: "house", label: "🏠 Casa" },
  { value: "car", label: "🚗 Auto" },
  { value: "education", label: "📚 Educación" },
  { value: "retirement", label: "👴 Jubilación" },
  { value: "transfer_fee", label: "🏦 Comisión" },
  { value: "bank_fee", label: "🏛️ Cargo Bancario" },
  { value: "interest", label: "💠 Interés" },
  { value: "other", label: "📦 Otro" },
];

const CURRENCY_FILTER_OPTIONS = CURRENCY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export default function TransactionsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Estado local para manejar filtros con VALORES, no etiquetas
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [filters, setFilters] = useState<{
    type?: string[];
    category?: string[];
    currency?: string[];
  }>({
    type: searchParams.get("type")?.split(",").filter(Boolean) || [],
    category: searchParams.get("category")?.split(",").filter(Boolean) || [],
    currency: searchParams.get("currency")?.split(",").filter(Boolean) || [],
  });
  const [sortConfig, setSortConfig] = useState<SortConfig<any> | null>(() => {
    const sortBy = searchParams.get("sortBy");
    const sortDirection = searchParams.get("sortDirection") as
      | "asc"
      | "desc"
      | null;
    return sortBy && sortDirection
      ? { key: sortBy, direction: sortDirection }
      : null;
  });

  // Sincronizar con URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (filters.type && filters.type.length > 0)
      params.set("type", filters.type.join(","));
    if (filters.category && filters.category.length > 0)
      params.set("category", filters.category.join(","));
    if (filters.currency && filters.currency.length > 0)
      params.set("currency", filters.currency.join(","));
    if (sortConfig) {
      params.set("sortBy", String(sortConfig.key));
      params.set("sortDirection", sortConfig.direction);
    }

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [searchQuery, filters, sortConfig, router, pathname]);

  const setFilter = (
    key: "type" | "category" | "currency",
    values: string[],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({ type: [], category: [], currency: [] });
    setSortConfig(null);
  };

  const getUniqueValues = () => [];

  // Definir campos de filtrado con solo las etiquetas visibles
  const filterFields: FilterFieldDef<any>[] = [
    {
      key: "type",
      label: "Tipo",
      options: TYPE_OPTIONS.map((t) => t.label),
    },
    {
      key: "category",
      label: "Categoría",
      options: CATEGORY_OPTIONS.map((c) => c.label),
    },
    {
      key: "currency",
      label: "Moneda",
      options: CURRENCY_FILTER_OPTIONS.map((c) => c.label),
    },
  ];

  const sortOptions: SortOptionDef<any>[] = [
    { key: "date", label: "Fecha" },
    { key: "amount", label: "Monto" },
    { key: "description", label: "Descripción" },
  ];

  // Wrapper del setFilter para convertir etiquetas a valores
  const handleSetFilter = (key: string | number | symbol, labels: string[]) => {
    const keyStr = String(key) as "type" | "category" | "currency";
    const options =
      keyStr === "type"
        ? TYPE_OPTIONS
        : keyStr === "category"
          ? CATEGORY_OPTIONS
          : CURRENCY_FILTER_OPTIONS;
    const values = labels
      .map((label) => options.find((opt) => opt.label === label)?.value)
      .filter((v): v is string => Boolean(v));
    setFilter(keyStr, values);
  };

  // Convertir valores actuales a etiquetas para mostrar
  const displayFilters: Record<string, string[]> = {
    type:
      filters.type
        ?.map((v) => TYPE_OPTIONS.find((t) => t.value === v)?.label)
        .filter((v): v is string => Boolean(v)) || [],
    category:
      filters.category
        ?.map((v) => CATEGORY_OPTIONS.find((c) => c.value === v)?.label)
        .filter((v): v is string => Boolean(v)) || [],
    currency:
      filters.currency
        ?.map((v) => CURRENCY_FILTER_OPTIONS.find((c) => c.value === v)?.label)
        .filter((v): v is string => Boolean(v)) || [],
  };

  return (
    <Filter
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      filters={displayFilters}
      setFilter={handleSetFilter}
      sortConfig={sortConfig}
      setSortConfig={setSortConfig}
      getUniqueValues={getUniqueValues}
      clearFilters={clearFilters}
      filterFields={filterFields}
      sortOptions={sortOptions}
      placeholder="Buscar transacción..."
    />
  );
}
