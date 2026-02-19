import { useMemo, useState } from "react";

export interface SortConfig<T> {
  key: keyof T;
  direction: "asc" | "desc";
}

export interface FilterLogic<T extends Record<string, any>> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: Partial<Record<keyof T, string[]>>;
  setFilter: (key: keyof T, values: string[]) => void;
  sortConfig: SortConfig<T> | null;
  setSortConfig: (config: SortConfig<T> | null) => void;
  getUniqueValues: (key: keyof T) => string[];
  clearFilters: () => void;
  filteredData: T[];
}

export function useDataFilters<T extends Record<string, any>>(
  data: T[],
): FilterLogic<T> {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Partial<Record<keyof T, string[]>>>(
    {},
  );
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);

  const setFilter = (key: keyof T, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({});
  };

  const getUniqueValues = (key: keyof T): string[] => {
    return Array.from(new Set(data.map((item) => String(item[key])))).filter(
      Boolean,
    );
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Buscar en todos los campos
      if (searchQuery) {
        const matchesSearch = Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase()),
        );
        if (!matchesSearch) return false;
      }

      // Aplicar filtros múltiples
      for (const [key, values] of Object.entries(filters) as [
        keyof T,
        string[],
      ][]) {
        if (values && values.length > 0) {
          if (!values.includes(String(item[key]))) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, searchQuery, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    sortConfig,
    setSortConfig,
    getUniqueValues,
    clearFilters,
    filteredData: sortedData,
  };
}
