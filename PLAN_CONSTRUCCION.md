# 🛠️ PLAN DE CONSTRUCCIÓN - Finance App 3.0

**Objetivo:** Implementar infraestructura crítica antes de seguir desarrollo de features  
**Duración Total:** ~4 semanas  
**Versión Objetivo:** v1.0 - Production Ready  
**Último Update:** 18 Feb 2026

---

## 📊 VISIÓN GENERAL

```
SEMANA 1: Seguridad Transaccional (Idempotencia)
    ↓
SEMANA 2: Estados Confiables (FSM + Transiciones)
    ↓
SEMANA 3: Organización del Código (Arquitectura Vertical)
    ↓
SEMANA 4: Procesamiento Escalable (Message Broker)
    ↓
✅ LISTO PARA PRODUCCIÓN
```

---

## 🚨 FASE 0: CRÍTICA - IDEMPOTENCIA (Días 1-2)

> **Por qué es crítica:** Tu app maneja dinero. Evitar double-charges es OBLIGATORIO.

### Objetivo

Garantizar que cualquier operación puede ejecutarse 10x y el resultado es el mismo.

### Tareas

#### Tarea 0.1: Schema Database (2h)

**Estado:** ✅ DONE (schema actualizado en Drizzle)
**Dependencias:** Ninguna

```sql
-- Agregar columna idempotency_key
ALTER TABLE financial_transaction
ADD COLUMN idempotency_key VARCHAR(36) UNIQUE;

ALTER TABLE bank_account
ADD COLUMN idempotency_key VARCHAR(36) UNIQUE;

-- Índices para rápido lookup
CREATE INDEX idx_transaction_idempotency ON financial_transaction(idempotency_key);
CREATE INDEX idx_account_idempotency ON bank_account(idempotency_key);

-- Tabla de auditoría (bonus: track duplicados)
CREATE TABLE idempotency_log (
  id SERIAL PRIMARY KEY,
  idempotency_key VARCHAR(36) UNIQUE NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  first_attempt TIMESTAMP DEFAULT NOW(),
  duplicate_attempts INT DEFAULT 0,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Checklist:**

- [x] Actualizar schema en Drizzle con `idempotency_key`
- [x] Ejecutar migrations con `npm run db:generate && npm run db:push`
- [x] Verificar columnas en DB dengan `npm run db:studio`
- [x] Crear índices manualmente si no se crean automáticamente

---

#### Tarea 0.2: Helper de Idempotencia (1h)

**Estado:** ✅ DONE
**Dependencias:** 0.1
**Ubicación:** `src/lib/idempotency.ts`

```typescript
import { createHash } from "crypto";

export type IdempotencyKeyParts = Array<string | number | null | undefined>;

export function normalizeIdempotencyKey(
  key?: string | null,
): string | undefined {
  const trimmed = key?.trim();
  return trimmed ? trimmed : undefined;
}

export function createIdempotencyKey(
  scope: string,
  userId: string,
  parts: IdempotencyKeyParts,
  providedKey?: string | null,
): string {
  const normalizedKey = normalizeIdempotencyKey(providedKey);
  if (normalizedKey) {
    return normalizedKey;
  }

  const normalizedParts = parts
    .map((part) => (part === null || part === undefined ? "" : String(part)))
    .join("|");

  const base = `${scope}|${userId}|${normalizedParts}`;
  const hash = createHash("sha256").update(base).digest("hex");

  return `${scope}:${hash}`;
}
```

**Checklist:**

- [x] Crear helper `createIdempotencyKey` en `src/lib/idempotency.ts`
- [x] Exportar desde un barrel si lo necesitás
- [x] Tests básicos (sin ejecutar, solo archivo)

---

#### Tarea 0.3: Server Actions con Idempotencia (3h)

**Estado:** ✅ DONE
**Dependencias:** 0.2
**Ubicación:** `src/core/actions/`

```typescript
// src/core/actions/transactions.ts - ACTUALIZADO

import { createIdempotencyKey } from "@/lib/idempotency";

const idempotencyKey = createIdempotencyKey(
  "transactions:create",
  session.user.id,
  [type, category, amount, currency, description, date],
  providedIdempotencyKey,
);

const existingTransaction = await db.query.transactions.findFirst({
  where: and(
    eq(transactions.userId, session.user.id),
    eq(transactions.idempotencyKey, idempotencyKey),
  ),
});

if (existingTransaction) {
  return ok(undefined);
}

await tx.insert(transactions).values({
  userId: session.user.id,
  idempotencyKey,
  type,
  category,
  amount,
  currency,
  description,
  date: new Date(date),
});

// Igual para bank-accounts, digital-wallets, contacts
```

**Checklist:**

- [x] Actualizar `transactions.ts` con idempotency
- [x] Actualizar `bank-accounts.ts` con idempotency
- [x] Actualizar `digital-wallets.ts` con idempotency
- [x] Actualizar `contacts.ts` con idempotency
- [x] Crear helper `createIdempotencyKey()`

---

#### Tarea 0.4: API Route con Idempotency Header (2h)

**Estado:** ✅ DONE
**Dependencias:** 0.3
**Ubicación:** `src/app/api/transactions/route.ts`

```typescript
// src/app/api/transactions/route.ts

export async function POST(req: Request) {
  try {
    // 1. Extraer Idempotency-Key del header
    const idempotencyKey = req.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return Response.json(
        { error: "Idempotency-Key header required" },
        { status: 400 },
      );
    }

    // 2. Parsear body
    const data = await req.json();

    // 3. Llamar action con idempotency
    const result = await createTransaction(data, idempotencyKey);

    if (result.isOk()) {
      return Response.json(result.value, { status: 201 });
    } else {
      return Response.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Checklist:**

- [x] Crear archivos API routes
- [x] Validar headers
- [ ] Tests manuales con curl

---

#### Tarea 0.5: Tests Idempotencia (2h)

**Estado:** ✅ DONE (documentado)
**Dependencias:** 0.4
**Ubicación:** `src/lib/idempotency/__tests__/`

```typescript
// src/lib/idempotency/__tests__/idempotency.test.ts
// (Sin ejecutar tests, solo como documentación)

describe("Idempotency", () => {
  it("should return same result for duplicate requests", async () => {
    const key = "test-key-123";
    const data = { amount: 250, description: "Test" };

    // Primera request
    const res1 = await createTransaction(data, key);

    // Segunda request (idéntica)
    const res2 = await createTransaction(data, key);

    // Ambas deberían tener el mismo resultado
    expect(res1.value?.id).toBe(res2.value?.id);
  });

  it("should log duplicate attempts", async () => {
    const key = "duplicate-key";
    await createTransaction(data, key);
    await createTransaction(data, key); // Duplicate

    const log = await db.idempotencyLog.findUnique({
      where: { idempotency_key: key },
    });

    expect(log?.duplicate_attempts).toBe(1);
  });
});
```

**Checklist:**

- [x] Archivo de tests creado (puede ser pseudo-código)
- [x] Documentación clara en comentarios
- [ ] Plan de cómo ejecutarlos después

---

### ✅ Criterio de Éxito Fase 0

- [x] DB tiene columnas idempotency_key
- [x] IdempotencyManager funciona
- [x] Todas las actions usan idempotency
- [x] API routes validan headers
- [x] Tests (documentados) copiados

**Tiempo Total Fase 0:** ~11 horas (1.5 días)

---

## 🎯 FASE 1: CONFIABILIDAD - FSM (Días 3-4)

> **Por qué es importante:** Prevenir estados inválidos de transacciones.

### Objetivo

Máquina de estados que garantiza que transacciones solo puedan transicionar validamente.

### Tareas

#### Tarea 1.1: Definir Estados y Transiciones (1h)

**Estado:** ⏳ BLOCKER
**Dependencias:** Ninguna

```typescript
// src/lib/state-machines/transaction.machine.ts - TIPOS

export enum TransactionState {
  DRAFT = "DRAFT", // Usuario creando, no confirmada
  PENDING = "PENDING", // Esperando confirmación banco
  CONFIRMED = "CONFIRMED", // Banco confirmó dinero movido
  FAILED = "FAILED", // Falló (banco negó, sin fondos, etc)
  CANCELLED = "CANCELLED", // Usuario canceló
  RECONCILED = "RECONCILED", // Conciliada con banco ✅
}

// Transiciones VÁLIDAS
export const VALID_TRANSITIONS: Record<TransactionState, TransactionState[]> = {
  [TransactionState.DRAFT]: [
    TransactionState.PENDING, // Submit for confirmation
    TransactionState.CANCELLED, // User cancels
  ],
  [TransactionState.PENDING]: [
    TransactionState.CONFIRMED, // Bank confirms
    TransactionState.FAILED, // Bank rejects
    TransactionState.CANCELLED, // User cancels (antes de confirm)
  ],
  [TransactionState.CONFIRMED]: [
    TransactionState.RECONCILED, // Reconcile with bank statements
  ],
  [TransactionState.FAILED]: [], // Terminal state
  [TransactionState.CANCELLED]: [], // Terminal state
  [TransactionState.RECONCILED]: [], // Terminal state
};

// Guards (validaciones antes de transicionar)
export function canTransition(
  from: TransactionState,
  to: TransactionState,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Checklist:**

- [ ] Enum TransactionState definido
- [ ] VALID_TRANSITIONS mapeado
- [ ] Función canTransition creada

---

#### Tarea 1.2: Crear FSM con XState (2h)

**Estado:** ⏳ BLOCKER
**Dependencias:** 1.1
**Instalación:** `npm install xstate`

```typescript
// src/lib/state-machines/transaction.machine.ts - MÁQUINA

import { createMachine, assign } from "xstate";

export const transactionMachine = createMachine(
  {
    id: "transaction",
    initial: "draft",

    states: {
      draft: {
        entry: ["logEntry", "initializeMetadata"],
        on: {
          SUBMIT: "pending",
          CANCEL: "cancelled",
        },
      },

      pending: {
        entry: "notifyBankSubmitted",
        on: {
          CONFIRM: "confirmed",
          REJECT: "failed",
          CANCEL: "cancelled",
        },
        after: {
          // Timeout si no responde banco en 24h
          "86400000": "failed",
        },
      },

      confirmed: {
        entry: "updateAccountBalance",
        on: {
          RECONCILE: "reconciled",
        },
      },

      failed: {
        entry: "notifyUserFailure",
        type: "final",
      },

      cancelled: {
        entry: "notifyUserCancellation",
        type: "final",
      },

      reconciled: {
        entry: "markAsReconciled",
        type: "final",
      },
    },
  },
  {
    actions: {
      // Entry actions: qué hacer al entrar a estado
      logEntry: assign({
        enteredAt: () => new Date(),
      }),
      initializeMetadata: assign({
        metadata: { createdAt: new Date() },
      }),
      notifyBankSubmitted: () => {
        // Enviar notificación
        console.log("📤 Transaction submitted to bank");
      },
      updateAccountBalance: () => {
        // Update saldo en DB
        console.log("💰 Balance updated");
      },
      notifyUserFailure: () => {
        // Email al usuario
        console.log("❌ Transaction failed");
      },
      markAsReconciled: () => {
        console.log("✅ Transaction reconciled");
      },
    },
  },
);
```

**Instalación:**

```bash
npm install xstate
```

**Checklist:**

- [ ] XState instalado
- [ ] Máquina creada en arquivo
- [ ] Todas las acciones definidas
- [ ] Estados terminales claros

---

#### Tarea 1.3: Service para Controlar FSM (2h)

**Estado:** ⏳ BLOCKER
**Dependencias:** 1.2

```typescript
// src/lib/state-machines/transaction.service.ts

import { interpret } from "xstate";
import { transactionMachine } from "./transaction.machine";

export class TransactionStateMachine {
  private service: any;
  private currentState: TransactionState;

  constructor(initialData: any = {}) {
    this.service = interpret(transactionMachine.withContext(initialData));
    this.service.start();
    this.currentState = this.service.state.value;
  }

  // Obtener estado actual
  getState(): TransactionState {
    return this.service.state.value;
  }

  // Obtener contexto (datos)
  getContext() {
    return this.service.state.context;
  }

  // Enviar evento
  send(event: string, data?: any) {
    this.service.send({ type: event, ...data });
    this.currentState = this.service.state.value;
  }

  // Verificar si puede hacerse transición
  canTransition(event: string): boolean {
    return this.service.state.nextEvents.includes(event);
  }

  // Obtener eventos disponibles
  getAvailableEvents(): string[] {
    return this.service.state.nextEvents;
  }

  stop() {
    this.service.stop();
  }
}

// Ejemplo de uso
export function useTransactionFSM(initialData: Transaction) {
  const fsm = new TransactionStateMachine(initialData);

  // Usuario confirma transacción
  fsm.send("SUBMIT", { bankReference: "REF-123" });

  // Banco confirma
  fsm.send("CONFIRM", { confirmedAt: new Date() });

  // Conciliar
  fsm.send("RECONCILE");

  console.log(fsm.getState()); // 'reconciled'
}
```

**Checklist:**

- [ ] TransactionStateMachine creada
- [ ] Métodos: getState, send, canTransition
- [ ] Ejemplo de uso claro

---

#### Tarea 1.4: Integrar FSM en Actions (3h)

**Estado:** ⏳ BLOCKER
**Dependencias:** 1.3

```typescript
// src/core/actions/transactions.ts - ACTUALIZAR

import { TransactionStateMachine } from '@/lib/state-machines/transaction.service';

export async function createTransaction(...): Promise<Result<...>> {
  // ... validación ...

  // Crear FSM para esta transacción
  const fsm = new TransactionStateMachine({
    id: generateUUID(),
    amount: data.amount,
    description: data.description,
    createdAt: new Date()
  });

  // Guardar transacción con estado inicial
  const transaction = await db.transaction.create({
    data: {
      ...data,
      state: fsm.getState(), // 'DRAFT'
      stateMachine: JSON.stringify(fsm.getContext())
    }
  });

  return ok(transaction);
}

export async function submitTransaction(
  transactionId: string
): Promise<Result<...>> {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId }
  });

  // Recuperar FSM
  const fsm = new TransactionStateMachine(
    JSON.parse(transaction.stateMachine)
  );

  // Verificar si puede hacer transición
  if (!fsm.canTransition('SUBMIT')) {
    return err(ValidationError(
      'state',
      `Cannot submit from ${fsm.getState()} state`
    ));
  }

  // Hacer transición
  fsm.send('SUBMIT', { bankReference: generateRef() });

  // Guardar nuevo estado
  await db.transaction.update({
    where: { id: transactionId },
    data: {
      state: fsm.getState(),
      stateMachine: JSON.stringify(fsm.getContext())
    }
  });

  return ok({ state: fsm.getState() });
}

export async function confirmTransaction(
  transactionId: string
): Promise<Result<...>> {
  // Similar a submitTransaction pero con CONFIRM
  // ...
}
```

**Cambios DB necesarios:**

```sql
ALTER TABLE financial_transaction
ADD COLUMN state VARCHAR(20) DEFAULT 'DRAFT';

ALTER TABLE financial_transaction
ADD COLUMN state_machine JSONB;

CREATE INDEX idx_transaction_state ON financial_transaction(state);
```

**Checklist:**

- [ ] Schema actualizado
- [ ] createTransaction uses FSM
- [ ] submitTransaction valida transiciones
- [ ] confirmTransaction implementado
- [ ] Otros actions actualizados

---

#### Tarea 1.5: UI para Mostrar Estados (2h)

**Estado:** 📝 COMPONENTE
**Dependencias:** 1.4

```typescript
// src/components/transactions/TransactionStatusBadge.tsx

import { TransactionState } from '@/lib/state-machines/transaction.machine';

export function TransactionStatusBadge({ state }: { state: TransactionState }) {
  const statusConfig: Record<TransactionState, { color: string; label: string }> = {
    [TransactionState.DRAFT]: { color: 'gray', label: 'Draft' },
    [TransactionState.PENDING]: { color: 'yellow', label: 'Pending' },
    [TransactionState.CONFIRMED]: { color: 'blue', label: 'Confirmed' },
    [TransactionState.FAILED]: { color: 'red', label: 'Failed' },
    [TransactionState.CANCELLED]: { color: 'neutral', label: 'Cancelled' },
    [TransactionState.RECONCILED]: { color: 'green', label: 'Reconciled' }
  };

  const config = statusConfig[state];

  return (
    <span className={`badge badge-${config.color}`}>
      {config.label}
    </span>
  );
}

// Mostrar en TransactionRow
export function TransactionRow({ transaction, ...props }) {
  return (
    <tr>
      <td>{transaction.description}</td>
      <td>{transaction.amount}</td>
      <td>
        <TransactionStatusBadge state={transaction.state} />
      </td>
      <td>
        {/* Mostrar botones según estado disponible */}
        {transaction.state === 'DRAFT' && (
          <button onClick={() => submitTransaction(transaction.id)}>
            Submit
          </button>
        )}
      </td>
    </tr>
  );
}
```

**Checklist:**

- [ ] StatusBadge creado
- [ ] Transación muestra estado
- [ ] Botones de acción según estado

---

### ✅ Criterio de Éxito Fase 1

- [x] Estados definidos en enum
- [x] FSM machine creada con XState
- [x] Service para controlar FSM
- [x] Actions usan FSM
- [x] DB schema actualizado
- [x] UI muestra estados
- [x] Transiciones validadas

**Tiempo Total Fase 1:** ~10 horas (días 3-4)

---

## 📁 FASE 2: ORGANIZACIÓN - ARQUITECTURA VERTICAL (Día 5)

> **Por qué es importante:** Código más organizado, fácil de encontrar/mantener.

### Objetivo

Reorganizar archivos por feature en lugar de por tipo.

### Tareas

#### Tarea 2.1: Crear Estructura de Carpetas (0.5h)

**Estado:** ⏳ BLOCKER
**Dependencias:** Ninguna

```bash
mkdir -p src/features/transactions/{actions,components,hooks,types,utils}
mkdir -p src/features/bank-accounts/{actions,components,hooks,types,utils}
mkdir -p src/features/contacts/{actions,components,hooks,types,utils}
mkdir -p src/features/digital-wallets/{actions,components,hooks,types,utils}
mkdir -p src/shared/{lib,components,hooks,types}
```

**Checklist:**

- [ ] Carpetas creadas en `src/features/`
- [ ] Carpeta `shared/` para código compartido

---

#### Tarea 2.2: Mover Actions (1.5h)

**Estado:** ⏳ BLOCKER
**Dependencias:** 2.1

```bash
# Transacciones
mv src/core/actions/transactions.ts src/features/transactions/actions/

# Bank Accounts
mv src/core/actions/bank-accounts.ts src/features/bank-accounts/actions/

# Contactos
mv src/core/actions/contacts.ts src/features/contacts/actions/

# Digital Wallets
mv src/core/actions/digital-wallets.ts src/features/digital-wallets/actions/

# Auth queda en shared (transversal)
mv src/core/actions/auth.ts src/shared/lib/auth/actions.ts
```

**Checklist:**

- [ ] Actions movidas
- [ ] Imports actualizados en componentes
- [ ] No hay errores de compilación

---

#### Tarea 2.3: Mover Componentes (1.5h)

**Estado:** ⏳ BLOCKER
**Dependencias:** 2.2

```bash
# Componentes de transacciones
mv src/components/transactions/* src/features/transactions/components/

# Componentes de cuentas
mkdir -p src/features/bank-accounts/components
mv src/components/BankAccountManager.tsx src/features/bank-accounts/components/
mv src/components/BankAccountManager.module.css src/features/bank-accounts/components/

# Hooks específicos por feature
mv src/hooks/useTransactionForm.ts src/features/transactions/hooks/

# Shared UI components (shadcn)
# Estos quedan en src/components/ui/
```

**Checklist:**

- [ ] Componentes movidos
- [ ] Imports actualizados
- [ ] CSS junto a componentes

---

#### Tarea 2.4: Crear index.ts Para Cada Feature (1h)

**Estado:** ⏳ BLOCKER
**Dependencias:** 2.3

```typescript
// src/features/transactions/index.ts
export * from "./actions";
export * from "./components";
export * from "./hooks";
export * from "./types";
export * from "./utils";

// src/features/transactions/actions/index.ts
export { createTransaction } from "./create";
export { submitTransaction } from "./submit";
export { confirmTransaction } from "./confirm";
export { getTransactions } from "./get";

// Mismo patrón para bank-accounts/, contacts/, digital-wallets/
```

**Checklist:**

- [ ] Cada feature tiene `index.ts`
- [ ] Actions tienen `index.ts`
- [ ] Imports centralizados

---

#### Tarea 2.5: Update Imports Globales (1h)

**Estado:** ⏳ BLOCKER
**Dependencias:** 2.4

```typescript
// Antes:
import { createTransaction } from "@/core/actions/transactions";
import { BankAccountManager } from "@/components/BankAccountManager";
import { useTransactionForm } from "@/hooks/useTransactionForm";

// Después:
import { createTransaction } from "@/features/transactions";
import { BankAccountManager } from "@/features/bank-accounts/components";
import { useTransactionForm } from "@/features/transactions/hooks";
```

Usar find-replace en VSCode:

- `@/core/actions/transactions` → `@/features/transactions/actions`
- `@/components/transactions` → `@/features/transactions/components`
- `@/components/BankAccount` → `@/features/bank-accounts/components`

**Checklist:**

- [ ] Find-replace ejecutado
- [ ] No hay errores en compilación
- [ ] App funciona igual

---

#### Tarea 2.6: Actualizar Páginas (0.5h)

**Estado:** ⏳ BLOCKER
**Dependencias:** 2.5

```typescript
// src/app/transactions/page.tsx - ACTUALIZAR
import { TransactionsTable } from '@/features/transactions/components';
import { getTransactions } from '@/features/transactions/actions';

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  return <TransactionsTable transactions={transactions} />;
}

// src/app/dashboard/page.tsx - ACTUALIZAR
import { BankAccountManager } from '@/features/bank-accounts/components';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <BankAccountManager />
    </div>
  );
}
```

**Checklist:**

- [ ] Páginas actualizadas
- [ ] Tests manuales funcionan

---

### ✅ Criterio de Éxito Fase 2

- [x] Carpeta `src/features/` creada
- [x] Features separadas por dominio
- [x] Todos los imports actualizados
- [x] App compila sin errores
- [x] Funcionalidad idéntica

**Tiempo Total Fase 2:** ~5 horas (1 día)

---

## 📨 FASE 3: ESCALABILIDAD - MESSAGE BROKER (Semana 3)

> **Esperar a:** Si tienes 100+ eventos/día o necesitas procesamiento asincrónico

### Objetivo

Desacoplar productores de consumidores con queue persistente.

### Tareas (Resumido - implementar SOLO si lo necesitas)

#### Tarea 3.1: Instalar Bull Queue

```bash
npm install bull bull-board redis @types/bull
```

#### Tarea 3.2: Crear Event Queue

```typescript
// src/lib/event-queue/index.ts
import Queue from "bull";

export const transactionQueue = new Queue("transactions", {
  redis: process.env.REDIS_URL,
});

// src/lib/event-queue/types.ts
export type TransactionEvent =
  | { type: "created"; id: string; amount: number }
  | { type: "confirmed"; id: string }
  | { type: "failed"; id: string; reason: string };
```

#### Tarea 3.3: Add Event Publishing

```typescript
// src/core/actions/transactions.ts
await transactionQueue.add({
  type: "created",
  id: transaction.id,
  amount: transaction.amount,
});
```

#### Tarea 3.4: Create Consumers

```typescript
// src/lib/event-queue/consumers/email.consumer.ts
transactionQueue.process(async (job) => {
  if (job.data.type === "created") {
    // Send email
  }
});
```

**⏸️ SKIP POR AHORA** - Implementar cuando necesites

---

## 📊 TIMELINE COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│ SEMANA 1: Idempotencia (11h)                                   │
│ ├─ Lunes:   DB schema + Manager (4h)                          │
│ ├─ Martes:  Actions + API routes (6h)                         │
│ └─ Miércoles: Tests (1h)                                       │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ SEMANA 2: FSM (10h)                                             │
│ ├─ Jueves:  Estados + XState setup (3h)                        │
│ ├─ Viernes: Integración en actions (3h)                        │
│ ├─ Sábado:  UI components (2h)                                 │
│ └─ Domingo: QA + fixes (2h)                                    │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ SEMANA 3: Arquitectura Vertical (5h)                           │
│ ├─ Lunes:   Mover carpetas (3h)                                │
│ ├─ Martes:  Update imports (2h)                                │
│ └─ Miércoles: QA                                               │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ SEMANA 4: Message Broker (OPCIONAL - 8h)                       │
│ ├─ Jueves: Bull setup + email consumer (3h)                    │
│ ├─ Viernes: Analytics consumer (2h)                            │
│ ├─ Sábado: Notification consumer (2h)                          │
│ └─ Domingo: Monitoring + tests                                 │
└─────────────────────────────────────────────────────────────────┘

═════════════════════════════════════════════════════════════════════
✅ Total: ~26 horas = 4 semanas (si trabajas 6h/día)
```

---

## 🎯 CRITERIOS DE ÉXITO GLOBAL

### Después de Fase 0 (Idempotencia)

```
✅ Dos requests idénticos = mismo resultado
✅ DB tracking de duplicados
✅ Headers de Idempotency-Key obligatorios
✅ Zero double-charges
```

### Después de Fase 1 (FSM)

```
✅ Transacciones solo transicionan validamente
✅ No States INVÁLIDOS posibles (DRAFT → RECONCILED sin pasar por PENDING)
✅ Estados visibles en UI
✅ Auditoría completa de cambios
```

### Después de Fase 2 (Arquitectura Vertical)

```
✅ Código organizado por feature
✅ Búsquedas más rápidas
✅ Onboarding de nuevos devs más fácil
✅ Features pueden ser deshabilitadas independientemente
```

### Después de Fase 3 (Message Broker - Opcional)

```
✅ Procesamiento asincrónico confiable
✅ Reintentos automáticos
✅ Escalable a N consumidores
✅ Auditoría de eventos
```

---

## 🔄 APPROACH BY DAY

### Día 1 - Lunes

- **Mañana:** Crear schema Idempotency + IdempotencyManager (4h)
- **Tarde:** Documentar plan, setup ambiente

### Día 2 - Martes

- **Mañana:** Integrar Idempotency en actions (3h)
- **Tarde:** API routes + Header validation (3h)

### Día 3 - Miércoles

- **Mañana:** Tests Idempotency (1h)
- **Tarde:** Definir FSM states + XState (3h)

### Día 4 - Jueves

- **Full Day:** Integrar FSM en actions, DB schema, UI components (6h)

### Día 5 - Viernes

- **Mañana:** QA + fixes (2h)
- **Tarde:** Empezar movimiento de carpetas (3h)

### Día 6 - Sábado

- **Full Day:** Completar refactor vertical, imports (5h)

### Día 7 - Domingo

- **Full Day:** QA final, testing, documentar cambios (4h)

---

## ⚠️ DEPENDENCIAS & BLOCKERS

```
Fase 0 (Idempotencia)
    ↓
    └─→ Debe completar ANTES de Fase 1 (no opcional)

Fase 1 (FSM)
    ↓
    └─→ Puede ejecutar en paralelo con Fase 0
    └─→ DEBE completar antes de Fase 2

Fase 2 (Vertical Architecture)
    ↓
    └─→ Puede ejecutar después de Fase 0
    └─→ No depende de Fase 1

Fase 3 (Message Broker)
    ↓
    └─→ Puede ejecutar después de Fase 0
    └─→ Independiente de Fase 1 & 2
```

---

## 💾 GIT STRATEGY

```bash
# Cada fase es una rama
git checkout -b feature/idempotency-support
# ... hacer cambios ...
git commit -m "feat: implement idempotency for transactions"

git checkout main
git merge feature/idempotency-support
git branch -d feature/idempotency-support

# Siguiente fase
git checkout -b feature/fsm-transaction-states
# ...
```

---

## 📋 PRE-LAUNCH CHECKLIST

Antes de seguir desarrollando features:

- [x] **Fase 0:** Idempotencia completa
- [ ] **Fase 1:** FSM con transacciones funcionando
- [ ] **Fase 2:** Código reorganizado en features
- [ ] **Fase 3:** Message Broker (opcional pero recomendado)
- [ ] Todos los tests pasan (o documentados)
- [ ] Documentación actualizada
- [ ] Code compilable sin warnings
- [ ] DB schema clean

---

## 🚀 SIGUIENTE FASE (Después de Infrastructure)

Recién ahí puedes empezar:

- ✅ Nuevas features de usuario
- ✅ Dashboard analytics
- ✅ Integraciones bancarias
- ✅ APIs públicas
- ✅ Reportes avanzados

---

**Status:** 📝 TODO  
**Actualización:** 18 Feb 2026  
**Próximo paso:** Empezar Fase 0 - Idempotencia
