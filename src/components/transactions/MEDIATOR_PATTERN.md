# Patrón Mediator: TransactionForm

## Descripción

El `TransactionForm` implementa el **Patrón Mediator** para coordinar la interacción entre múltiples campos de formulario que dependen unos de otros, evitando que los campos se comuniquen directamente entre sí.

## Problema que Resuelve

Sin el patrón Mediator, tendrías **acoplamiento directo** entre campos:

```tsx
// ❌ MAL: Cada campo conoce y manipula otros campos
<TypeSelect
  onChange={(type) => {
    // Este campo debe conocer todos los demás campos
    if (type === "transfer") {
      amountField.setRequired(true);
      currencyField.setEnabled(true);
      fromAccountField.show();
      toAccountField.show();
      categoryField.hide();
      contactField.hide();
    } else if (type === "expense") {
      categoryField.show();
      categoryField.setRequired(true);
      toAccountField.hide();
      contactField.hide();
    }
    // ... más lógica acoplada
  }}
/>
```

### Problemas:

- 🔴 Alto acoplamiento entre componentes
- 🔴 Lógica de negocio dispersa
- 🔴 Difícil de mantener y extender
- 🔴 Duplicación de código
- 🔴 Difícil de testear

## Solución: Mediator Pattern

```tsx
// ✅ BIEN: El formulario (Mediator) coordina todo
function TransactionForm() {
  const [type, setType] = useState<TransactionType>("expense");
  const [flowMethod, setFlowMethod] = useState<"cash" | "transfer">("cash");
  const [formState, setFormState] = useState({...});

  // MEDIATOR: Toda la lógica de coordinación centralizada
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);

    // El mediator decide qué campos resetear
    setFormState(prev => ({
      ...prev,
      category: '',
      fromAccountId: '',
      toAccountId: '',
      contactId: '',
    }));

    // El mediator decide el método de flujo
    if (isTransferType(newType)) {
      setFlowMethod('transfer');
    }
  };

  // Los campos son "tontos" - solo reportan al mediator
  return (
    <>
      <TypeSelect value={type} onChange={handleTypeChange} />
      <CategorySelect
        visible={shouldShowCategory(type)}
        required={isCategoryRequired(type)}
      />
      <AccountSelect visible={shouldShowAccounts(type, flowMethod)} />
    </>
  );
}
```

## Arquitectura

```
                    ┌────────────────────────────────┐
                    │   TransactionForm (Mediator)   │
                    │                                │
                    │  • Mantiene formState          │
                    │  • Coordina validaciones       │
                    │  • Gestiona visibilidad        │
                    │  • Controla flujo de datos     │
                    │  • Maneja interdependencias    │
                    └────┬───────┬───────┬───────┬───┘
                         │       │       │       │
        ┌────────────────┴───┐   │   ┌───┴──────────────┐
        │                    │   │   │                  │
        ▼                    ▼   ▼   ▼                  ▼
   ┌─────────┐       ┌─────────────┐       ┌───────────────────┐
   │  Type   │◄─────►│   Amount    │◄─────►│   Currency        │
   │ Select  │       │   Input     │       │   Select          │
   │(Colle-  │       │  (Colleague)│       │  (Colleague)      │
   │ague)    │       └─────────────┘       └───────────────────┘
   └─────────┘              ▲                        ▲
       │                    │                        │
       │            ┌───────┴────────┐              │
       │            │                │              │
       ▼            ▼                ▼              ▼
   ┌─────────┐  ┌─────────┐    ┌─────────┐   ┌─────────┐
   │Category │  │  From   │    │   To    │   │ Contact │
   │ Select  │  │ Account │    │ Account │   │ Select  │
   │(Colle-  │  │(Colle-  │    │(Colle-  │   │(Colle-  │
   │ague)    │  │ague)    │    │ague)    │   │ague)    │
   └─────────┘  └─────────┘    └─────────┘   └─────────┘

   ⚠️ IMPORTANTE: Ningún Colleague se comunica directamente con otro
   TODO pasa a través del Mediator
```

## Componentes del Patrón

### 1. Mediator (TransactionForm)

El componente que coordina todas las interacciones:

```tsx
function TransactionForm({
  accounts,
  goals,
  bankAccounts,
  digitalWallets,
  contacts,
}: Props) {
  // Estado centralizado del mediator
  const [type, setType] = useState<TransactionType>("expense");
  const [flowMethod, setFlowMethod] = useState<"cash" | "transfer">("cash");
  const [formState, setFormState] = useState({
    amount: "",
    currency: "ARS",
    date: new Date().toISOString().split("T")[0],
    description: "",
    categoryDetail: "",
    fromAccountId: "",
    toAccountId: "",
    category: "",
  });

  // Lógica de coordinación del mediator
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    resetRelatedFields(newType);
    updateFlowMethod(newType);
  };

  const handleFlowMethodChange = (method: "cash" | "transfer") => {
    setFlowMethod(method);
    resetAccountFields();
  };

  return <form>{/* Colleagues que reportan al mediator */}</form>;
}
```

### 2. Colleagues (Campos del Formulario)

Componentes "tontos" que solo interactúan con el Mediator:

```tsx
// Colleague 1: Type Select
<select value={type} onChange={(e) => handleTypeChange(e.target.value)}>
  <option value="expense">Gasto</option>
  <option value="income">Ingreso</option>
  <option value="transfer_own_accounts">Transferencia propia</option>
</select>;

// Colleague 2: Category Select
{
  shouldShowCategory(type) && (
    <select
      value={formState.category}
      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
      required={isCategoryRequired(type)}
    >
      {getCategoryOptions(type).map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Colleague 3: Account Select
{
  shouldShowAccounts(type, flowMethod) && (
    <select
      value={formState.fromAccountId}
      onChange={(e) =>
        setFormState({ ...formState, fromAccountId: e.target.value })
      }
    >
      {getAvailableAccounts(flowMethod).map((acc) => (
        <option key={acc.id} value={acc.id}>
          {acc.name}
        </option>
      ))}
    </select>
  );
}
```

## Reglas de Coordinación

El Mediator implementa reglas complejas de interdependencia:

### Regla 1: Tipo → Campos Visibles

```tsx
const getVisibleFields = (type: TransactionType) => {
  const fieldMap = {
    expense: {
      category: true,
      amount: true,
      currency: true,
      fromAccount: true,
      toAccount: false,
      contact: false,
    },
    income: {
      category: true,
      amount: true,
      currency: true,
      fromAccount: false,
      toAccount: true,
      contact: false,
    },
    transfer_own_accounts: {
      category: false,
      amount: true,
      currency: true,
      fromAccount: true,
      toAccount: true,
      contact: false,
    },
    transfer_third_party: {
      category: false,
      amount: true,
      currency: true,
      fromAccount: true,
      toAccount: false,
      contact: true,
    },
  };

  return fieldMap[type];
};
```

### Regla 2: FlowMethod → Cuentas Disponibles

```tsx
const getAvailableAccounts = (flowMethod: "cash" | "transfer") => {
  if (flowMethod === "cash") {
    // Solo cuentas de efectivo
    return accounts.filter((acc) => acc.type === "cash");
  } else {
    // Bancos y wallets
    return [...bankAccounts, ...digitalWallets];
  }
};
```

### Regla 3: Tipo → Categorías Disponibles

```tsx
const getCategoryOptions = (type: TransactionType) => {
  const categoryMap = {
    expense: EXPENSE_CATEGORIES,
    income: INCOME_CATEGORIES,
    saving: SAVING_CATEGORIES,
    investment: INVESTMENT_CATEGORIES,
  };

  return categoryMap[type] || [];
};
```

### Regla 4: Tipo + FlowMethod → Validaciones

```tsx
const validate = () => {
  const errors: string[] = [];

  // El mediator decide las reglas de validación
  if (type === "expense" && !formState.category) {
    errors.push("La categoría es requerida para gastos");
  }

  if (flowMethod === "transfer" && !formState.fromAccountId) {
    errors.push("Debes seleccionar una cuenta origen");
  }

  if (
    type === "transfer_own_accounts" &&
    formState.fromAccountId === formState.toAccountId
  ) {
    errors.push("Las cuentas origen y destino no pueden ser iguales");
  }

  return errors;
};
```

## Flujo de Interacción Completo

### Escenario: Usuario cambia tipo de transacción

```
1. Usuario selecciona "Transferencia entre mis cuentas"
        ↓
2. TypeSelect notifica al Mediator
        ↓
3. Mediator ejecuta lógica de coordinación:
        ├─→ setType('transfer_own_accounts')
        ├─→ setFlowMethod('transfer')
        ├─→ resetFormState({ category: '', contactId: '' })
        ├─→ Calcula campos visibles
        └─→ Actualiza opciones de cuentas
        ↓
4. Mediator re-renderiza con nueva configuración:
        ├─→ CategorySelect: visible = false
        ├─→ FromAccountSelect: visible = true, options = [bancos, wallets]
        ├─→ ToAccountSelect: visible = true, options = [bancos, wallets]
        └─→ ContactSelect: visible = false
        ↓
5. Usuario ve formulario actualizado sin bugs
```

### Diagrama de Secuencia

```
Usuario      TypeSelect    Mediator    CategorySelect  AccountSelect  ContactSelect
  │              │            │              │               │              │
  │─Selecciona──▶│            │              │               │              │
  │ "Transfer"   │            │              │               │              │
  │              │─onChange──▶│              │               │              │
  │              │            │              │               │              │
  │              │            │──Decide──────│               │              │
  │              │            │  ocultar     │               │              │
  │              │            │              │               │              │
  │              │            │──────────────────Decide──────│              │
  │              │            │              │   mostrar     │              │
  │              │            │              │               │              │
  │              │            │──────────────────Decide──────────────────────│
  │              │            │              │               │    mostrar   │
  │              │            │              │               │              │
  │              │            │──────────────────Decide──────────────────────│
  │              │            │              │               │    ocultar   │
  │              │            │              │               │              │
  │              │            │──Re-render───▶               │              │
  │              │            │──Re-render───────────────────▶              │
  │              │            │──Re-render───────────────────────────────────▶
  │              │            │              │               │              │
  │◀─────────────────UI actualizada con campos correctos────────────────────│
  │              │            │              │               │              │
```

## Ventajas del Patrón

### ✅ Bajo Acoplamiento

Los campos no se conocen entre sí, solo conocen al Mediator:

```tsx
// Campo no necesita saber de otros campos
<TypeSelect onChange={handleTypeChange} />

// vs

// ❌ Campo acoplado a otros campos
<TypeSelect onChange={(type) => {
  updateCategory(type);
  updateAccounts(type);
  updateContact(type);
}} />
```

### ✅ Lógica Centralizada

Toda la lógica de coordinación está en un solo lugar:

```tsx
// Fácil de encontrar y modificar
const TransactionForm = () => {
  // AQUÍ está TODA la lógica de coordinación
  // No dispersa en múltiples archivos
};
```

### ✅ Fácil de Extender

Agregar nuevos campos o reglas es simple:

```tsx
// Agregar nuevo campo
const [taxRate, setTaxRate] = useState(0);

// Agregar nueva regla
if (type === "income" && amount > 10000) {
  setTaxRate(0.21); // Aplicar impuesto
}
```

### ✅ Fácil de Testear

Puedes testear la lógica de coordinación aisladamente:

```tsx
describe("TransactionForm Mediator", () => {
  it("muestra categoria cuando tipo es expense", () => {
    const { result } = renderHook(() => useTransactionForm());

    act(() => {
      result.current.setType("expense");
    });

    expect(result.current.shouldShowCategory()).toBe(true);
  });

  it("oculta categoria cuando tipo es transfer", () => {
    const { result } = renderHook(() => useTransactionForm());

    act(() => {
      result.current.setType("transfer_own_accounts");
    });

    expect(result.current.shouldShowCategory()).toBe(false);
  });
});
```

### ✅ Reutilizable

Puedes extraer la lógica del mediator a un hook personalizado:

```tsx
// hooks/useTransactionFormMediator.ts
export function useTransactionFormMediator() {
  const [type, setType] = useState<TransactionType>("expense");
  const [formState, setFormState] = useState({...});

  const shouldShowCategory = () => { /* ... */ };
  const shouldShowAccounts = () => { /* ... */ };
  const getAvailableAccounts = () => { /* ... */ };

  return {
    type,
    setType,
    formState,
    setFormState,
    shouldShowCategory,
    shouldShowAccounts,
    getAvailableAccounts,
  };
}

// En el componente
function TransactionForm() {
  const mediator = useTransactionFormMediator();

  return (
    <form>
      <TypeSelect onChange={mediator.setType} />
      {mediator.shouldShowCategory() && <CategorySelect />}
    </form>
  );
}
```

## Comparación con Alternativas

### Sin Mediator Pattern

```tsx
// ❌ Acoplamiento directo
<TypeSelect onChange={(type) => {
  // Lógica dispersa en cada campo
  if (type === 'transfer') {
    categoryRef.current.hide();
    accountRef.current.show();
    contactRef.current.hide();
  }
}} />

<CategorySelect onCategoryChange={(cat) => {
  // Más lógica dispersa
  if (cat === 'food') {
    amountRef.current.setMax(5000);
  }
}} />
```

### Con Mediator Pattern (Actual)

```tsx
// ✅ Comunicación centralizada
const handleTypeChange = (type) => {
  setType(type);
  // TODA la lógica aquí
  resetFields();
  updateVisibility();
  updateValidations();
};

<TypeSelect onChange={handleTypeChange} />
<CategorySelect
  visible={shouldShowCategory(type)}
  required={isCategoryRequired(type)}
/>
```

## Mejora Propuesta: FormMediator Dedicado

Para formularios muy complejos, usa el `FormMediator` de @/lib/formMediator:

```tsx
import { useFormMediator } from "@/lib/formMediator";

function TransactionForm() {
  const { mediator, getFieldProps } = useFormMediator();

  // Configurar reglas
  useEffect(() => {
    mediator.addRule("category", {
      condition: ({ type }) => type === "expense",
      config: { visible: true, required: true },
    });

    mediator.addRule("category", {
      condition: ({ type }) => type === "transfer_own_accounts",
      config: { visible: false, required: false },
    });
  }, []);

  return (
    <form>
      <TypeSelect {...getFieldProps("type")} />
      <CategorySelect {...getFieldProps("category")} />
    </form>
  );
}
```

## Referencias

- [Patrón Mediator - Refactoring Guru](https://refactoring.guru/design-patterns/mediator)
- [Form Coordination - Kent C. Dodds](https://kentcdodds.com/blog/form-coordination)
- [React Hook Form](https://react-hook-form.com/)
