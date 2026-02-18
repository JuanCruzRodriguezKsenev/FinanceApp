# Patrón Mediator: Dialog System

## Descripción

El sistema de diálogos implementa el **Patrón Mediator** para coordinar la comunicación entre el Dialog, su contenido, y los componentes externos, evitando acoplamiento directo.

## Problema que Resuelve

Sin el patrón Mediator:

```tsx
// ❌ Acoplamiento directo entre componentes
function TransactionForm() {
  const closeDialog = () => {
    dialog.close(); // ¿Cómo accede al dialog?
  };

  const refreshTable = () => {
    table.refresh(); // ¿Cómo accede a la tabla?
  };

  const updateSummary = () => {
    summary.update(); // ¿Cómo accede al summary?
  };

  const handleSubmit = () => {
    saveTransaction();
    closeDialog(); // Acoplado al dialog
    refreshTable(); // Acoplado a la tabla
    updateSummary(); // Acoplado al summary
  };
}
```

### Problemas:

- 🔴 Alto acoplamiento entre componentes
- 🔴 Componentes conocen detalles de implementación
- 🔴 Difícil de reutilizar el formulario
- 🔴 Difícil de testear

## Solución: Mediator Pattern

```tsx
// ✅ Mediator coordina la comunicación
export default function NewTransactionDialog({ ... }: Props) {
  const [open, setOpen] = useState(false); // Mediator controla estado

  return (
    <>
      <button onClick={() => setOpen(true)}>
        Nueva Transacción
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)} // Mediator maneja cierre
      >
        <TransactionForm
          onSuccess={() => setOpen(false)} // Mediator coordina
          variant="dialog"
        />
      </Dialog>
    </>
  );
}
```

## Arquitectura

```
                ┌─────────────────────────────────┐
                │  NewTransactionDialog           │
                │  (Mediator)                     │
                │                                 │
                │  • Controla estado open         │
                │  • Coordina apertura/cierre     │
                │  • Desacopla Dialog de Form     │
                │  • Maneja eventos externos      │
                └────┬───────────────┬────────────┘
                     │               │
                     │               │
          ┌──────────┴──────┐   ┌───┴────────────────┐
          │                 │   │                    │
          ▼                 ▼   ▼                    ▼
    ┌──────────┐      ┌──────────────┐      ┌──────────────┐
    │  Button  │      │    Dialog    │      │Transaction   │
    │(Trigger) │      │  (Colleague) │      │    Form      │
    │(Colle-   │      │              │      │ (Colleague)  │
    │ague)     │      │  • UI Modal  │      │              │
    └──────────┘      │  • Overlay   │      │ • Campos     │
                      │  • Focus     │      │ • Validación │
                      │  • Escape    │      │ • Submit     │
                      └──────────────┘      └──────────────┘

Los Colleagues NO se comunican directamente
TODO pasa por el Mediator
```

## Componentes del Patrón

### 1. Mediator (NewTransactionDialog)

Coordina la comunicación entre Button, Dialog y Form:

```tsx
export default function NewTransactionDialog({
  accounts,
  goals,
  bankAccounts,
  digitalWallets,
  contacts,
  triggerClassName,
}: Props) {
  // Estado del mediator
  const [open, setOpen] = useState(false);

  // Mediator coordina apertura
  const handleOpen = () => {
    setOpen(true);
  };

  // Mediator coordina cierre
  const handleClose = () => {
    setOpen(false);
  };

  // Mediator coordina éxito del formulario
  const handleSuccess = () => {
    setOpen(false);
    // Podría emitir eventos adicionales aquí
  };

  return (
    <>
      {/* Colleague 1: Trigger Button */}
      <button onClick={handleOpen}>Nueva Transacción</button>

      {/* Colleague 2: Dialog Container */}
      <Dialog open={open} onClose={handleClose} title="Nueva transacción">
        {/* Colleague 3: Form Content */}
        <TransactionForm
          accounts={accounts}
          goals={goals}
          bankAccounts={bankAccounts}
          digitalWallets={digitalWallets}
          contacts={contacts}
          onSuccess={handleSuccess}
          showHeader={false}
          variant="dialog"
        />
      </Dialog>
    </>
  );
}
```

### 2. Colleague: Dialog

Componente reutilizable que solo conoce al Mediator:

```tsx
export default function Dialog({
  open,
  onClose,
  title,
  children,
  variant = "default",
}: DialogProps) {
  // Dialog NO conoce qué contiene
  // Solo reporta eventos al Mediator

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose(); // Notifica al Mediator
    }
  };

  const handleOverlayClick = () => {
    onClose(); // Notifica al Mediator
  };

  return open ? (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.dialog}>
        <button onClick={onClose}>×</button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  ) : null;
}
```

### 3. Colleague: TransactionForm

Formulario que solo conoce al Mediator:

```tsx
function TransactionForm({ onSuccess, variant = "page", ...props }: Props) {
  // Form NO conoce si está en un dialog o página
  // Solo reporta éxito al Mediator

  const handleSubmit = async () => {
    await createTransaction(data);

    // Notifica éxito al Mediator
    onSuccess?.();
  };

  return <form onSubmit={handleSubmit}>{/* Campos del formulario */}</form>;
}
```

### 4. Colleague: Trigger Button

Botón que solo conoce al Mediator:

```tsx
<button onClick={() => setOpen(true)}>
  {/* Button NO conoce qué abre */}
  {/* Solo notifica al Mediator */}
  Nueva Transacción
</button>
```

## Flujo de Interacción

### Escenario 1: Abrir Dialog

```
Usuario      Button        Mediator        Dialog         Form
  │            │              │              │             │
  │─ Click ───▶│              │              │             │
  │            │─ onClick ───▶│              │             │
  │            │              │─ setOpen(T) ─▶             │
  │            │              │              │             │
  │            │              │◀─ render ────│             │
  │            │              │              │─ mount ────▶│
  │            │              │              │             │
  │◀───────────────Dialog visible────────────────────────│
  │            │              │              │             │
```

### Escenario 2: Submit y Cerrar

```
Usuario      Form          Mediator        Dialog      Table/Summary
  │            │              │              │              │
  │─ Submit ─▶│              │              │              │
  │            │─saveData()─▶│              │              │
  │            │              │              │              │
  │            │─ onSuccess ─▶│              │              │
  │            │              │─setOpen(F)──▶              │
  │            │              │              │              │
  │            │              │◀─unmount─────│              │
  │            │              │              │              │
  │            │              │─eventBus.────────────────────▶
  │            │              │ publish()    │              │
  │            │              │              │              │
  │◀─────────────Dialog cerrado + datos actualizados──────│
  │            │              │              │              │
```

### Escenario 3: Cerrar sin guardar

```
Usuario      Dialog        Mediator        Form
  │            │              │              │
  │─ ESC ─────▶│              │              │
  │            │─ onClose ───▶│              │
  │            │              │─setOpen(F)──│
  │            │              │              │
  │            │◀─unmount─────│─ cleanup() ─│
  │            │              │              │
  │◀───────────Dialog cerrado sin guardar───│
  │            │              │              │
```

## Ventajas del Patrón

### ✅ Componentes Reutilizables

Dialog y Form pueden usarse en diferentes contextos:

```tsx
// En página
<TransactionForm
  onSuccess={refreshPage}
  variant="page"
/>

// En dialog
<Dialog>
  <TransactionForm
    onSuccess={closeDialog}
    variant="dialog"
  />
</Dialog>

// En modal
<Modal>
  <TransactionForm
    onSuccess={closeModal}
    variant="modal"
  />
</Modal>
```

### ✅ Bajo Acoplamiento

Los componentes no se conocen entre sí:

```tsx
// ✅ Dialog no conoce a TransactionForm
// ✅ TransactionForm no conoce a Dialog
// ✅ Button no conoce a Dialog ni Form
// ✅ Solo el Mediator los conoce a todos
```

### ✅ Fácil de Testear

Puedes testear cada componente aisladamente:

```tsx
// Test Dialog
it("llama onClose cuando se presiona ESC", () => {
  const onClose = jest.fn();
  render(<Dialog open onClose={onClose} />);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).toHaveBeenCalled();
});

// Test Form
it("llama onSuccess cuando se guarda", async () => {
  const onSuccess = jest.fn();
  render(<TransactionForm onSuccess={onSuccess} />);
  await submitForm();
  expect(onSuccess).toHaveBeenCalled();
});

// Test Mediator
it("cierra dialog cuando form tiene éxito", () => {
  const { getByText } = render(<NewTransactionDialog />);
  fireEvent.click(getByText("Nueva Transacción"));
  // Dialog abierto
  fireEvent.submit(getByRole("form"));
  // Dialog cerrado
});
```

### ✅ Fácil de Extender

Agregar nueva funcionalidad al Mediator:

```tsx
export default function NewTransactionDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);

    // Nuevas funcionalidades del Mediator:
    eventBus.publish('transaction:created'); // Notificar otros componentes
    showNotification('Transacción creada'); // Mostrar notificación
    router.refresh(); // Refrescar datos
    logAnalytics('transaction_created'); // Analítica
  };

  return (/* ... */);
}
```

## Variantes del Patrón

### Variante 1: Dialog Controlado Externamente

```tsx
// Mediator en componente padre
function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>Abrir</button>
      <TransactionsTable />
      <TransactionsSummary />

      <NewTransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          refreshData();
        }}
      />
    </>
  );
}
```

### Variante 2: Dialog con Context API

```tsx
// Mediator como Context
const DialogContext = createContext<DialogContextType>(null);

function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);

  const openDialog = (component: ReactNode) => {
    setDialogs([...dialogs, { id: uuid(), component }]);
  };

  const closeDialog = (id: string) => {
    setDialogs(dialogs.filter((d) => d.id !== id));
  };

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {dialogs.map((d) => (
        <Dialog key={d.id} onClose={() => closeDialog(d.id)}>
          {d.component}
        </Dialog>
      ))}
    </DialogContext.Provider>
  );
}

// Uso
function AnyComponent() {
  const { openDialog } = useDialog();

  const handleClick = () => {
    openDialog(<TransactionForm />);
  };
}
```

### Variante 3: Dialog con EventBus

```tsx
// Mediator global
function TransactionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = eventBus.subscribe('dialog:open', () => {
      setDialogOpen(true);
    });
    return unsubscribe;
  }, []);

  return (/* ... */);
}

// Cualquier componente puede abrir el dialog
function AnyComponent() {
  const handleClick = () => {
    eventBus.publish('dialog:open');
  };
}
```

## Patrones Relacionados

### 1. Observer + Mediator

Combinar ambos patrones para máxima flexibilidad:

```tsx
function NewTransactionDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    // Mediator: Cierra el dialog
    setOpen(false);

    // Observer: Notifica a otros componentes
    eventBus.publish('transaction:created');
  };

  return (/* ... */);
}

// Otros componentes escuchan
function TransactionsTable() {
  useEffect(() => {
    return eventBus.subscribe('transaction:created', refresh);
  }, []);
}
```

### 2. Command Pattern

Encapsular acciones como comandos:

```tsx
const dialogCommands = {
  open: () => setOpen(true),
  close: () => setOpen(false),
  submit: (data) => {
    save(data);
    setOpen(false);
  },
};
```

## Comparación con Alternativas

### Sin Mediator

```tsx
// ❌ Acoplamiento directo
<Dialog ref={dialogRef}>
  <TransactionForm
    onSubmit={() => {
      dialogRef.current.close();
      tableRef.current.refresh();
      summaryRef.current.update();
    }}
  />
</Dialog>
```

### Con Mediator (Actual)

```tsx
// ✅ Desacoplado
<NewTransactionDialog
  onSuccess={() => {
    // Mediator coordina todo
  }}
/>
```

## Referencias

- [Patrón Mediator - Refactoring Guru](https://refactoring.guru/design-patterns/mediator)
- [React Portals](https://react.dev/reference/react-dom/createPortal)
- [Dialog Element - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
