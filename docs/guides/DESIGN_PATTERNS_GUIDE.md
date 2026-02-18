# Guía de Patrones de Diseño - Finance App

Esta guía documenta los patrones de diseño implementados en la aplicación, su propósito, ubicación y cómo usarlos efectivamente.

## 📋 Índice

1. [Patrón Observer](#patrón-observer)
2. [Patrón Mediator](#patrón-mediator)
3. [Implementaciones](#implementaciones)
4. [Guía de Uso](#guía-de-uso)
5. [Referencias](#referencias)

---

## 🔍 Patrón Observer

### ¿Qué es?

El patrón Observer define una dependencia uno-a-muchos entre objetos, de modo que cuando un objeto cambia de estado, todos sus dependientes son notificados y actualizados automáticamente.

### ¿Cuándo usar?

- Necesitas sincronizar múltiples componentes cuando cambia un estado
- Quieres desacoplar componentes que necesitan reaccionar a eventos
- Necesitas implementar un sistema de eventos o notificaciones
- Quieres que componentes reaccionen a cambios sin conocerse entre sí

### Implementaciones en el Proyecto

#### 1. ThemeProvider (Context Observer)

**Ubicación:** `src/contexts/ThemeProvider.tsx`

**Documentación:** [src/contexts/OBSERVER_PATTERN.md](src/contexts/OBSERVER_PATTERN.md)

**Propósito:** Sincronizar el tema visual en toda la aplicación.

**Ejemplo de uso:**

```tsx
// En cualquier componente
import { useTheme } from "@/contexts/ThemeProvider";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return <button onClick={() => setTheme("dark")}>Cambiar a oscuro</button>;
}
```

**Diagrama:**

```
ThemeProvider (Subject)
       ↓ notify()
  ┌────┼────┬────┬────┐
  ▼    ▼    ▼    ▼    ▼
Button Card Nav  Icon Menu
(Observers se actualizan automáticamente)
```

---

#### 2. URL-based Observer (Filters)

**Ubicación:** `src/components/transactions/TransactionsFilter.tsx`

**Documentación:** [src/components/transactions/OBSERVER_PATTERN.md](src/components/transactions/OBSERVER_PATTERN.md)

**Propósito:** Sincronizar filtros, tabla y resumen usando la URL como Subject.

**Ejemplo de uso:**

```tsx
// El filtro actualiza la URL
const handleFilterChange = (filters) => {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type.join(","));
  router.replace(`${pathname}?${params.toString()}`);
};

// Next.js notifica automáticamente a todos los componentes
// que dependen de searchParams
```

**Diagrama:**

```
URL (?type=expense)
       ↓ notify()
  ┌────┼────┬────┬────┐
  ▼    ▼    ▼    ▼    ▼
Filter Table Summary Page Browser
(Todos observan la URL)
```

**Ventajas especiales:**

- ✅ URLs compartibles
- ✅ Historial del navegador funciona
- ✅ SEO friendly
- ✅ SSR compatible

---

#### 3. EventBus (Observable Events)

**Ubicación:** `src/lib/eventBus.ts`

**Propósito:** Comunicación desacoplada entre componentes a través de eventos.

**Ejemplo de uso:**

```tsx
// Publicar evento
import { eventBus, EVENTS } from "@/lib/eventBus";

eventBus.publish(EVENTS.TRANSACTION.CREATED, {
  transaction: newTransaction,
  amount: 1000,
});

// Suscribirse a evento
useEffect(() => {
  const unsubscribe = eventBus.subscribe(EVENTS.TRANSACTION.CREATED, (data) => {
    console.log("Nueva transacción:", data);
    refreshData();
  });

  return unsubscribe; // Limpiar al desmontar
}, []);
```

**Eventos disponibles:**

```typescript
EVENTS.TRANSACTION.CREATED; // Nueva transacción
EVENTS.TRANSACTION.UPDATED; // Transacción actualizada
EVENTS.TRANSACTION.DELETED; // Transacción eliminada
EVENTS.ACCOUNT.CREATED; // Nueva cuenta
EVENTS.ACCOUNT.UPDATED; // Cuenta actualizada
EVENTS.THEME.CHANGED; // Tema cambiado
EVENTS.FILTER.APPLIED; // Filtros aplicados
```

**Diagrama:**

```
TransactionForm ──publish──▶ EventBus ─┬─subscribe─▶ Table
                                       ├─subscribe─▶ Summary
                                       └─subscribe─▶ Dashboard
```

**Implementado en:**

- `src/components/transactions/TransactionForm.tsx` (Publisher)
- `src/app/dashboard/DashboardContent.tsx` (Subscriber)

---

## 🎯 Patrón Mediator

### ¿Qué es?

El patrón Mediator define un objeto que encapsula cómo un conjunto de objetos interactúan, promoviendo el acoplamiento débil al evitar que los objetos se refieran entre sí explícitamente.

### ¿Cuándo usar?

- Componentes necesitan comunicarse pero no deben conocerse directamente
- La lógica de interacción entre componentes se vuelve compleja
- Quieres centralizar la lógica de coordinación
- Formularios con campos interdependientes
- Sistemas de diálogos y modales

### Implementaciones en el Proyecto

#### 1. TransactionForm (Form Mediator)

**Ubicación:** `src/components/transactions/TransactionForm.tsx`

**Documentación:** [src/components/transactions/MEDIATOR_PATTERN.md](src/components/transactions/MEDIATOR_PATTERN.md)

**Propósito:** Coordinar la interacción entre múltiples campos del formulario.

**Ejemplo conceptual:**

```tsx
// El formulario coordina todos los campos
function TransactionForm() {
  const [type, setType] = useState('expense');
  const [formState, setFormState] = useState({...});

  // Mediator decide qué campos mostrar
  const shouldShowCategory = () => {
    return type === 'expense' || type === 'income';
  };

  // Mediator decide qué cuentas están disponibles
  const getAvailableAccounts = () => {
    if (flowMethod === 'cash') {
      return accounts.filter(acc => acc.type === 'cash');
    }
    return allAccounts;
  };

  return (
    <>
      <TypeSelect onChange={setType} />
      {shouldShowCategory() && <CategorySelect />}
      <AccountSelect accounts={getAvailableAccounts()} />
    </>
  );
}
```

**Diagrama:**

```
        TransactionForm (Mediator)
               ↓ coordina
  ┌────────┬───┼───┬────────┬────────┐
  ▼        ▼       ▼        ▼        ▼
Type    Amount  Currency  Account  Category
(Colleagues - NO se comunican directamente)
```

**Reglas de coordinación:**

```typescript
// Tipo → Campos visibles
type = 'expense'              → category: visible, account: visible
type = 'transfer_own_accounts' → category: hidden, fromAccount & toAccount: visible
type = 'transfer_third_party'  → contact: visible, toAccount: hidden

// FlowMethod → Cuentas disponibles
flowMethod = 'cash'     → accounts: solo efectivo
flowMethod = 'transfer' → accounts: todas
```

---

#### 2. Dialog System (UI Mediator)

**Ubicación:** `src/components/ui/Dialog/Dialog.tsx`

**Documentación:** [src/components/ui/Dialog/MEDIATOR_PATTERN.md](src/components/ui/Dialog/MEDIATOR_PATTERN.md)

**Propósito:** Coordinar apertura/cierre del dialog con su contenido y componentes externos.

**Ejemplo de uso:**

```tsx
import NewTransactionDialog from "@/components/transactions/NewTransactionDialog";

function Dashboard() {
  return (
    <div>
      {/* El mediator coordina Button, Dialog y Form */}
      <NewTransactionDialog accounts={accounts} goals={goals} />
    </div>
  );
}
```

**Mediator interno:**

```tsx
// src/components/transactions/NewTransactionDialog.tsx
export default function NewTransactionDialog() {
  const [open, setOpen] = useState(false); // Mediator controla estado

  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <TransactionForm
          onSuccess={() => setOpen(false)} // Mediator coordina
        />
      </Dialog>
    </>
  );
}
```

**Diagrama:**

```
NewTransactionDialog (Mediator)
         ↓ coordina
  ┌──────┼──────┬──────┐
  ▼      ▼      ▼      ▼
Button Dialog Form  Table
(Ninguno conoce a los demás)
```

---

#### 3. FormMediator (Advanced)

**Ubicación:** `src/lib/formMediator.ts`

**Propósito:** Sistema avanzado de mediación para formularios complejos con reglas declarativas.

**Ejemplo de uso:**

```tsx
import { useFormMediator } from "@/lib/formMediator";

function AdvancedForm() {
  const { mediator, getFieldProps } = useFormMediator();

  useEffect(() => {
    // Definir reglas de coordinación
    mediator.addRule("email", {
      condition: ({ userType }) => userType === "business",
      config: { required: true, visible: true },
    });

    mediator.addRule("companyName", {
      condition: ({ userType }) => userType === "business",
      config: { visible: true, required: true },
    });

    mediator.addRule("companyName", {
      condition: ({ userType }) => userType === "personal",
      config: { visible: false, required: false },
    });
  }, []);

  return (
    <form>
      <input {...getFieldProps("email")} />
      <input {...getFieldProps("companyName")} />
    </form>
  );
}
```

**Ejemplo completo:** [src/components/transactions/TransactionFormWithMediator.example.tsx](src/components/transactions/TransactionFormWithMediator.example.tsx)

---

## 🚀 Guía de Uso

### Cuándo usar Observer

✅ **Usar cuando:**

- Múltiples componentes necesitan reaccionar al mismo cambio
- Quieres desacoplar emisores de receptores de eventos
- Necesitas broadcast de cambios
- Implementas sistemas de notificaciones

❌ **NO usar cuando:**

- Solo un componente necesita saber del cambio
- La comunicación es bidireccional compleja (usa Mediator)
- El estado es simple y local

### Cuándo usar Mediator

✅ **Usar cuando:**

- Componentes tienen interacciones complejas entre sí
- La lógica de coordinación es difícil de seguir
- Formularios con > 5 campos interdependientes
- Quieres centralizar reglas de negocio

❌ **NO usar cuando:**

- Los componentes no interactúan entre sí
- La lógica es simple y directa
- Solo necesitas pasar props

### Combinando Patrones

Puedes combinar Observer + Mediator para máximo poder:

```tsx
function NewTransactionDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    // Mediator: cierra el dialog
    setOpen(false);

    // Observer: notifica otros componentes
    eventBus.publish("transaction:created");
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <TransactionForm onSuccess={handleSuccess} />
      </Dialog>
    </>
  );
}

// Otros componentes escuchan
function TransactionsTable() {
  useEffect(() => {
    return eventBus.subscribe("transaction:created", refresh);
  }, []);
}
```

---

## 📚 Estructura del Proyecto

```
src/
├── lib/
│   ├── eventBus.ts                    ← EventBus (Observer)
│   └── formMediator.ts                ← FormMediator (Mediator)
│
├── contexts/
│   ├── ThemeProvider.tsx              ← Theme Observer
│   └── OBSERVER_PATTERN.md            ← Documentación
│
├── components/
│   ├── transactions/
│   │   ├── TransactionForm.tsx        ← Form Mediator
│   │   ├── TransactionsFilter.tsx     ← URL Observer
│   │   ├── NewTransactionDialog.tsx   ← Dialog Mediator
│   │   ├── OBSERVER_PATTERN.md        ← Documentación
│   │   ├── MEDIATOR_PATTERN.md        ← Documentación
│   │   └── TransactionFormWithMediator.example.tsx
│   │
│   └── ui/
│       └── Dialog/
│           ├── Dialog.tsx             ← Dialog Component
│           └── MEDIATOR_PATTERN.md    ← Documentación
│
└── app/
    └── dashboard/
        ├── page.tsx                   ← Server Component
        └── DashboardContent.tsx       ← EventBus Subscriber
```

---

## 🎓 Recursos de Aprendizaje

### Observer Pattern

- [Documentación ThemeProvider](src/contexts/OBSERVER_PATTERN.md)
- [Documentación Filters](src/components/transactions/OBSERVER_PATTERN.md)
- [Refactoring Guru - Observer](https://refactoring.guru/design-patterns/observer)

### Mediator Pattern

- [Documentación TransactionForm](src/components/transactions/MEDIATOR_PATTERN.md)
- [Documentación Dialog](src/components/ui/Dialog/MEDIATOR_PATTERN.md)
- [Refactoring Guru - Mediator](https://refactoring.guru/design-patterns/mediator)

### Ejemplos Prácticos

- [TransactionForm con Mediator](src/components/transactions/TransactionFormWithMediator.example.tsx)
- [EventBus Implementation](src/lib/eventBus.ts)
- [FormMediator Implementation](src/lib/formMediator.ts)

---

## 📊 Resumen Rápido

| Patrón       | Uso                   | Implementación     | Ubicación                  |
| ------------ | --------------------- | ------------------ | -------------------------- |
| **Observer** | Tema global           | Context API        | `ThemeProvider.tsx`        |
| **Observer** | Filtros               | URL + Router       | `TransactionsFilter.tsx`   |
| **Observer** | Eventos               | EventBus           | `eventBus.ts`              |
| **Mediator** | Formulario            | Estado local       | `TransactionForm.tsx`      |
| **Mediator** | Dialog                | Componente wrapper | `NewTransactionDialog.tsx` |
| **Mediator** | Formularios complejos | FormMediator class | `formMediator.ts`          |

---

## 🔧 Mejores Prácticas

### Observer Pattern

1. **Siempre limpia las suscripciones**

   ```tsx
   useEffect(() => {
     const unsubscribe = eventBus.subscribe("event", handler);
     return unsubscribe; // ← IMPORTANTE
   }, []);
   ```

2. **Usa tipos constantes para eventos**

   ```tsx
   // ✅ Bueno
   eventBus.publish(EVENTS.TRANSACTION.CREATED, data);

   // ❌ Malo
   eventBus.publish("transaction:created", data);
   ```

3. **Documenta qué datos espera cada evento**
   ```typescript
   // En eventBus.ts
   export interface TransactionCreatedEvent {
     transaction: Transaction;
     amount: number;
     currency: string;
   }
   ```

### Mediator Pattern

1. **Mantén el mediator simple**

   ```tsx
   // ✅ Bueno: lógica clara
   const shouldShowCategory = () => {
     return type === "expense" || type === "income";
   };

   // ❌ Malo: lógica compleja en línea
   {
     type === "expense" ||
       (type === "income" && !isTransfer) ||
       (type === "saving" && category !== "custom" && <CategorySelect />);
   }
   ```

2. **Extrae reglas complejas a funciones**

   ```tsx
   // ✅ Bueno
   const getVisibleFields = (type: TransactionType) => {
     // Lógica compleja aquí
     return fieldConfig;
   };
   ```

3. **Usa FormMediator para formularios con > 10 campos**
   ```tsx
   // Si tu formulario crece, usa FormMediator
   const { mediator, getFieldProps } = useFormMediator();
   ```

---

## 🎯 Próximos Pasos

1. **Lee las documentaciones específicas** en cada carpeta
2. **Revisa los ejemplos** de código en los archivos `.example.tsx`
3. **Experimenta** agregando nuevos eventos o reglas
4. **Refactoriza** componentes existentes usando estos patrones cuando sea apropiado

---

¿Tienes preguntas? Consulta las documentaciones específicas o revisa los ejemplos de código.

**Happy coding! 🚀**
