# Patrón Observer: Sistema de Filtros de Transacciones

## Descripción

El sistema de filtros implementa el **Patrón Observer basado en URL**, donde la URL actúa como el Subject y múltiples componentes actúan como Observers que reaccionan a cambios en los parámetros de búsqueda.

## Arquitectura

```
          ┌───────────────────────────────────────────┐
          │   URL SearchParams (Subject Observable)   │
          │   ?type=expense&category=food&search=...  │
          │                                           │
          │   • Mantiene estado en la URL             │
          │   • Notifica a observers mediante router  │
          │   • Persistente (shareable, history)      │
          └─────────┬─────────────────────────────────┘
                    │ notify() cuando URL cambia
                    │
          ┌─────────┼─────────┬────────────────┬──────────────┐
          ▼         ▼         ▼                ▼              ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Filter   │ │  Table   │ │ Summary  │ │Dashboard │ │ Browser  │
    │Component │ │Component │ │Component │ │  Page    │ │  Back    │
    │(Observer)│ │(Observer)│ │(Observer)│ │(Observer)│ │(Observer)│
    └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
    Lee filtros  Re-renderiza Actualiza   Re-fetch     Mantiene
    de URL       con datos    totales     datos        historial
                 filtrados    filtrados   filtrados
```

## Componentes del Patrón

### 1. Subject (URL + Next.js Router)

La URL actúa como el Subject que mantiene el estado:

```tsx
// URL como estado observable
// http://localhost:3000/dashboard?type=expense&category=food&search=comida

// Next.js router notifica cambios automáticamente
const searchParams = useSearchParams(); // Hook que "observa" la URL
```

### 2. Publisher (TransactionsFilter)

Componente que modifica el Subject (URL) y notifica a todos los observers:

```tsx
export default function TransactionsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [filters, setFilters] = useState({
    type: searchParams.get("type")?.split(",") || [],
    category: searchParams.get("category")?.split(",") || [],
    currency: searchParams.get("currency")?.split(",") || [],
  });

  // Notificar cambios actualizando la URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.type?.length) params.set("type", filters.type.join(","));
    if (filters.category?.length)
      params.set("category", filters.category.join(","));

    // Actualizar URL (notify todos los observers)
    router.replace(`${pathname}?${params.toString()}`);
  }, [filters, router, pathname]);

  return <Filter fields={filterFields} sorts={sortOptions} />;
}
```

### 3. Observers (Múltiples Componentes)

#### Observer 1: TransactionsTable

```tsx
// Se re-renderiza automáticamente cuando cambian searchParams
export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;

  // Re-fetch con nuevos parámetros
  const transactions = await getTransactions({
    type: params.type,
    category: params.category,
    search: params.search,
  });

  return <TransactionsTable transactions={transactions} />;
}
```

#### Observer 2: TransactionsSummary

```tsx
// Recibe transacciones filtradas y actualiza totales
function TransactionsSummary({ transactions }) {
  const totals = useMemo(() => {
    return calculateTotals(transactions);
  }, [transactions]); // Re-calcula cuando transactions cambia

  return <Summary data={totals} />;
}
```

#### Observer 3: Browser History

El navegador también es un observer que mantiene el historial:

```tsx
// El botón "atrás" funciona automáticamente
// /?type=expense → volver ← /dashboard
```

## Flujo de Actualización Completo

### Paso 1: Usuario aplica un filtro

```tsx
// Usuario selecciona "Gastos" en el filtro
<FilterSelect
  value="expense"
  onChange={(value) => setFilters({ ...filters, type: [value] })}
/>
```

### Paso 2: TransactionsFilter actualiza la URL

```tsx
// useEffect detecta cambio en filters
useEffect(() => {
  const params = new URLSearchParams();
  params.set("type", "expense");
  router.replace(`/dashboard?type=expense`);
}, [filters]);
```

### Paso 3: Next.js notifica a todos los observers

```
URL cambió a: /dashboard?type=expense
       ↓
Next.js Router notifica cambio
       ↓
       ├─→ Dashboard Page: Re-ejecuta getTransactions()
       ├─→ TransactionsFilter: Actualiza UI del filtro
       ├─→ TransactionsTable: Recibe nuevos datos filtrados
       ├─→ TransactionsSummary: Recalcula totales
       └─→ Browser: Agrega entrada al historial
```

### Paso 4: Componentes reaccionan

```tsx
// Dashboard Page
const transactions = await getTransactions({ type: "expense" });
// Retorna solo transacciones de tipo "expense"

// TransactionsSummary
const totals = calculateTotals(transactions);
// Calcula totales solo de gastos

// TransactionsFilter
const activeFilters = searchParams.get("type")?.split(",");
// Muestra "Gastos" como filtro activo
```

## Diagrama de Secuencia

```
Usuario          Filter          URL           Next.js         Table/Summary
  │                │              │               │                  │
  │─ Selecciona ──▶│              │               │                  │
  │   "Gastos"     │              │               │                  │
  │                │──setFilters─▶│               │                  │
  │                │              │               │                  │
  │                │─router.push─▶│               │                  │
  │                │   (?type=    │               │                  │
  │                │    expense)  │               │                  │
  │                │              │──Re-render───▶│                  │
  │                │              │               │                  │
  │                │              │               │──getTransactions─▶
  │                │              │               │  (type=expense)  │
  │                │              │               │                  │
  │                │              │               │◀─────Datos───────│
  │                │              │               │    filtrados     │
  │                │              │               │                  │
  │                │◀─────────────│◀─────────────│                  │
  │◀───UI actualizada con "Gastos" activo────────│                  │
  │                │              │               │                  │
  │◀─────────────────────Tabla muestra solo gastos─────────────────│
  │                │              │               │                  │
```

## Ventajas del Patrón

### ✅ Sincronización Automática

Todos los componentes se actualizan automáticamente cuando cambian los filtros.

```tsx
// No necesitas propagar cambios manualmente
// TODO se sincroniza vía URL
```

### ✅ URLs Compartibles (Shareable)

Los usuarios pueden compartir enlaces con filtros aplicados:

```
https://app.com/dashboard?type=expense&category=food&search=restaurante
```

### ✅ Historial del Navegador

El botón "atrás" funciona correctamente:

```
Historial:
1. /dashboard
2. /dashboard?type=expense
3. /dashboard?type=expense&category=food
   ↑ Usuario puede volver atrás
```

### ✅ Server-Side Rendering

Los filtros funcionan en la primera carga (SSR):

```tsx
// El servidor puede renderizar con filtros aplicados
export default async function DashboardPage({ searchParams }) {
  // searchParams está disponible en el servidor
  const transactions = await getTransactions(await searchParams);
}
```

### ✅ SEO Friendly

Los bots pueden indexar diferentes vistas de datos:

```
/dashboard?type=income     → Vista de ingresos
/dashboard?type=expense    → Vista de gastos
/dashboard?category=food   → Vista de comida
```

### ✅ Deep Linking

Los usuarios pueden guardar enlaces específicos como favoritos.

## Comparación con Alternativas

### Sin Observer Pattern (Estado Local)

```tsx
// ❌ Malo: Estado en el componente padre
function Dashboard() {
  const [filters, setFilters] = useState({});

  return (
    <>
      <Filter onFilterChange={setFilters} />
      <Table filters={filters} />
      <Summary filters={filters} />
    </>
  );
}

// Problemas:
// - No shareable
// - No history
// - Prop drilling
// - No SSR support
```

### Con Observer Pattern basado en URL (Actual)

```tsx
// ✅ Bueno: Estado en la URL
function Dashboard({ searchParams }) {
  // Cada componente lee de la URL independientemente
  return (
    <>
      <Filter /> {/* Lee y escribe en URL */}
      <Table /> {/* Lee de URL */}
      <Summary /> {/* Lee de URL */}
    </>
  );
}

// Ventajas:
// ✓ Shareable
// ✓ History support
// ✓ No prop drilling
// ✓ SSR support
```

## Hooks Personalizados

### useDataFilters

Un hook que encapsula la lógica de filtrado:

```tsx
export function useDataFilters<T>(data: T[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Partial<Record<keyof T, string[]>>>(
    {},
  );
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Aplicar búsqueda
      if (searchQuery && !matchesSearch(item, searchQuery)) {
        return false;
      }

      // Aplicar filtros
      for (const [key, values] of Object.entries(filters)) {
        if (values?.length && !values.includes(String(item[key]))) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, filters]);

  return { filteredData, setSearchQuery, setFilter, setSortConfig };
}
```

## Patrones Relacionados

### 1. Command Pattern

Cada cambio de filtro puede ser un comando:

```tsx
const filterCommands = {
  setType: (type: string) => ({ type: "SET_TYPE", payload: type }),
  setCategory: (cat: string) => ({ type: "SET_CATEGORY", payload: cat }),
  clear: () => ({ type: "CLEAR_ALL" }),
};
```

### 2. Memento Pattern

El historial del navegador actúa como Memento:

```tsx
// Guardar estado
router.push("/dashboard?type=expense");

// Restaurar estado
router.back(); // Vuelve al estado anterior
```

## Referencias

- [Patrón Observer - Refactoring Guru](https://refactoring.guru/design-patterns/observer)
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [URL State Management](https://www.smashingmagazine.com/2021/07/state-management-nextjs/)
