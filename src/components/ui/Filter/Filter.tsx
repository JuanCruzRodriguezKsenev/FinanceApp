import { useState, useRef, useEffect } from "react";
import styles from "./Filter.module.css";
import { SortConfig } from "@/hooks/useDataFilters";

// Definición de campos de filtrado
export interface FilterFieldDef<T> {
  key: keyof T;
  label: string;
  options?: string[];
}

// Definición simple para opciones de ordenamiento
export interface SortOptionDef<T> {
  label: string;
  key: keyof T;
}

interface Props<T> {
  // Datos del Hook
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filters: Partial<Record<keyof T, string[]>>; // Cambiado a string[]
  setFilter: (key: keyof T, val: string[]) => void; // Cambiado a string[]
  sortConfig: SortConfig<T> | null;
  setSortConfig: (conf: SortConfig<T>) => void;
  getUniqueValues: (key: keyof T) => string[];
  clearFilters: () => void;

  filterFields: FilterFieldDef<T>[];
  sortOptions: SortOptionDef<T>[];
  placeholder?: string;
}

export default function Filter<T>({
  searchQuery,
  setSearchQuery,
  filters,
  setFilter,
  sortConfig,
  setSortConfig,
  getUniqueValues,
  clearFilters,
  filterFields,
  sortOptions,
  placeholder = "Search...",
}: Props<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calcular cuántos filtros están activos
  const activeFiltersCount = Object.values(filters).reduce<number>(
    (count, values) => count + (Array.isArray(values) ? values.length : 0),
    0,
  );

  const toggleSortDirection = () => {
    if (!sortConfig && sortOptions.length > 0) {
      setSortConfig({
        key: sortOptions[0].key,
        direction: "asc",
      });
      return;
    }

    if (sortConfig) {
      setSortConfig({
        key: sortConfig.key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    }
  };

  const handleSortKeyChange = (newKey: string) => {
    if (!newKey) return;
    const key = newKey as keyof T;
    setSortConfig({
      key: key,
      direction: sortConfig?.direction || "asc",
    });
  };

  // Toggle de valores múltiples
  const toggleFilterValue = (key: keyof T, value: string) => {
    const currentValues = filters[key] || [];

    if (value === "all") {
      // Si se hace clic en "All", limpiar todos los filtros de este campo
      setFilter(key, []);
    } else {
      // Toggle del valor
      if (currentValues.includes(value)) {
        // Remover el valor si ya está seleccionado
        setFilter(
          key,
          currentValues.filter((v) => v !== value),
        );
      } else {
        // Agregar el valor
        setFilter(key, [...currentValues, value]);
      }
    }
  };

  return (
    <div className={styles.container} ref={popoverRef}>
      {/* 1. SEARCH BAR */}
      <div className={styles.searchWrapper}>
        <svg
          className={styles.searchIcon}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 2. FILTER TRIGGER BUTTON */}
      <button
        className={styles.filterTriggerBtn}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filters
        {activeFiltersCount > 0 && (
          <span className={styles.badge}>{activeFiltersCount}</span>
        )}
      </button>

      {/* 3. MENU FLOTANTE (POPOVER) */}
      {isOpen && (
        <div className={styles.popover}>
          {filterFields.map((field) => {
            const options = field.options || getUniqueValues(field.key);
            const currentValues = filters[field.key] || [];

            return (
              <div key={String(field.key)} className={styles.filterSection}>
                <span className={styles.sectionTitle}>{field.label}</span>
                <div className={styles.pillsContainer}>
                  {/* Opción "All" */}
                  <button
                    className={`${styles.pill} ${
                      currentValues.length === 0 ? styles.pillActive : ""
                    }`}
                    onClick={() => toggleFilterValue(field.key, "all")}
                  >
                    All
                  </button>
                  {/* Opciones Dinámicas - Múltiples selecciones */}
                  {options.map((opt) => (
                    <button
                      key={opt}
                      className={`${styles.pill} ${
                        currentValues.includes(opt) ? styles.pillActive : ""
                      }`}
                      onClick={() => toggleFilterValue(field.key, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className={styles.popoverFooter}>
            <button
              className={styles.resetBtn}
              onClick={() => {
                clearFilters();
                setIsOpen(false);
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* 4. SORT AREA */}
      <div className={styles.sortContainer}>
        <select
          className={styles.sortSelect}
          value={String(sortConfig?.key) || ""}
          onChange={(e) => handleSortKeyChange(e.target.value)}
        >
          {!sortConfig && (
            <option value="" disabled>
              Sort By...
            </option>
          )}
          {sortOptions.map((opt) => (
            <option key={String(opt.key)} value={String(opt.key)}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          className={styles.sortDirectionBtn}
          onClick={toggleSortDirection}
          title={sortConfig?.direction === "asc" ? "Ascending" : "Descending"}
          disabled={!sortConfig && sortOptions.length === 0}
        >
          {sortConfig?.direction === "asc" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M3 12h12M3 18h6" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 18h18M3 12h12M3 6h6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
