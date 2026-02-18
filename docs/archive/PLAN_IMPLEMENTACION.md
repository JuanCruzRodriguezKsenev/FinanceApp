# 📋 PLAN DE IMPLEMENTACIÓN DETALLADO

**Fecha:** 18 de febrero de 2026  
**Proyecto:** Finance App 3.0  
**Base:** Análisis de ANALISIS_Y_SOLUCIONES_OPTIMIZADAS.md

---

## 🎯 OBJETIVOS

Implementar todas las mejoras identificadas en el análisis, con enfoque en:

1. **Escalabilidad**: Código que crece sin complejidad
2. **Optimización**: Performance y experiencia de usuario
3. **Modularización**: Responsabilidades claras y separadas
4. **Mantenibilidad**: Fácil buscar/entender/actualizar/eliminar/agregar

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### Métricas Iniciales

| Métrica                 | Valor Actual                                   |
| ----------------------- | ---------------------------------------------- |
| Archivos TypeScript/TSX | 97                                             |
| console.\* en código    | 44                                             |
| Líneas de código        | ~8,500                                         |
| Archivos duplicados     | 2 (transactions.ts + enhanced-transactions.ts) |
| Archivos no usados      | ~1,400 líneas estimadas                        |
| Type Coverage           | ~90%                                           |
| Patrones implementados  | 0/14                                           |

### Problemas Críticos Detectados

#### 1. ❌ **Sin Result Pattern** (Prioridad: 🔴 CRÍTICA)

- **Ubicación**: Todos los archivos en `src/core/actions/`
- **Problema**: Try/catch sin type-safety
- **Archivos afectados**:
  - `src/core/actions/transactions.ts`
  - `src/core/actions/enhanced-transactions.ts` (duplicado)
  - `src/core/actions/bank-accounts.ts`
  - `src/core/actions/contacts.ts`
  - `src/core/actions/digital-wallets.ts`
  - `src/core/actions/auth.ts`

#### 2. ❌ **Sin Circuit Breaker** (Prioridad: 🔴 CRÍTICA)

- **Ubicación**: No existe infraestructura
- **Problema**: Sin protección ante fallos externos
- **Necesario para**: APIs externas, DB queries

#### 3. ❌ **44 console.\* en producción** (Prioridad: 🔴 CRÍTICA)

- **Ubicación**:
  - auth.ts: 2 console.error
  - auth actions: 2 console.error
  - bank-accounts.ts: 6 console.error
  - contacts.ts: 10 console.error
  - digital-wallets.ts: 5 console.error
  - enhanced-transactions.ts: 4 console.error
  - transactions.ts: 4 console.error
  - DashboardContent.tsx: 3 console.log (INFO)
  - ui-test/page.tsx: 2 console.log (testing)
  - eventBus.ts: 1 console.error
  - formMediator.ts: 1 console.error
  - LogoutButton.tsx: 1 console.error
  - EJEMPLOS.tsx: 1 console.log
  - TransactionFormWithMediator.example.tsx: 1 console.log

#### 4. ❌ **Código duplicado** (Prioridad: 🔴 CRÍTICA)

- **transactions.ts** vs **enhanced-transactions.ts**: ~800 líneas duplicadas
- Ambos tienen funciones similares sin abstracción

#### 5. ❌ **Sin Logger System** (Prioridad: 🔴 CRÍTICA)

- No existe `src/lib/logger/`
- Todos los errores van a console.error

#### 6. ⚠️ **Sin arquitectura 3-layer** (Prioridad: 🟠 ALTA)

- No existe separación Repository/Service/Adapter
- Business logic mezclada con DB access

#### 7. ⚠️ **Hooks con useState múltiple** (Prioridad: 🟠 ALTA)

- TransactionForm usa ~8 useState
- No hay state machine

#### 8. ⚠️ **Imports desorganizados** (Prioridad: 🟠 ALTA)

- No hay orden consistente
- Falta ESLint auto-sort

#### 9. ⚠️ **Sin Dependabot** (Prioridad: 🟠 ALTA)

- No hay `.github/dependabot.yml`
- Actualizaciones manuales

#### 10. ⚠️ **Documentación fragmentada** (Prioridad: 🟡 MEDIA)

- 7 archivos README/docs diferentes
- No hay centralización

---

## ✅ PROGRESO ACTUAL (Actualizado 18/02/2026)

**Completado:**

- ✅ Logger System en `src/lib/logger/`
- ✅ Migración de console.\* a logger (producción)
- ✅ Consolidación `enhanced-transactions.ts` → `transactions.ts`
- ✅ TransactionForm migrado a useReducer (machine + hook)
- ✅ Dependabot configurado
- ✅ ESLint import sorting configurado
- ✅ Ejemplos/documentación movidos a `examples/`
- ✅ Result Pattern base creado en `src/lib/result/`
- ✅ Migración a Result en `transactions` + páginas consumidoras
- ✅ Migración a Result en `bank-accounts`, `contacts`, `digital-wallets` y helpers de `auth`
- ✅ **Circuit Breaker System** implementado en `src/lib/circuit-breaker/`
  - ✅ Types: CircuitBreakerState, Config, ICircuitBreaker, CircuitBreakerOpenError
  - ✅ Implementation: Máquina de estados (CLOSED → OPEN → HALF_OPEN)
  - ✅ Utilities: withCircuitBreaker, decorator, factory presets
  - ✅ Global Registry: Monitoreo de todos los breakers
  - ✅ Comprehensive tests: 20+ test cases
  - ✅ Documentation: USAGE.md con patrones y best practices
- ✅ **Validators Library** implementado en `src/lib/validators/`
  - ✅ Types: ValidationResult, ValidationError, Validator, Schema, ValidatorBuilder
  - ✅ Field validators: String, password, financial (email, CBU, IBAN, amount, creditCard)
  - ✅ Builder: Fluent API con métodos encadenables
  - ✅ Schema: Validación de objetos completos con error collection
  - ✅ Error handling: Detailed ValidationError con field, message, code, constraints
  - ✅ Presets: userRegistration, bankAccount, transaction, contact
  - ✅ Documentation: USAGE.md extensivo (5+ usage patterns, examples, best practices)

**Métricas actuales (post-implementación):**

| Métrica                        | Estado actual                               |
| ------------------------------ | ------------------------------------------- |
| console.\* en código           | 0 en producción (excepciones intencionales) |
| Archivos duplicados            | 0                                           |
| useState en TransactionForm    | 1 reducer + state centralizado              |
| Infraestructura de resiliencia | Circuit Breaker (CLOSED → OPEN → HALF_OPEN) |
| Result Pattern coverage        | 38+ funciones de server actions             |
| Validadores reutilizables      | 20+ validators con fluent builder API       |

**Pendiente inmediato:**

- ⏳ Aplicar validators a server actions (cuando sea necesario)
- ⏳ Crear migration guide para usuarios finales

---

## 🚀 PLAN DE EJECUCIÓN

### Fase 0: Preparación (30 min)

```bash
# Crear backup
git branch --force backup/pre-refactor
git checkout -b refactor/architecture-improvements

# Crear estructura de carpetas
mkdir -p src/lib/result
mkdir -p src/lib/circuit-breaker
mkdir -p src/lib/logger
mkdir -p src/core/transactions/repository
mkdir -p src/core/transactions/service
mkdir -p src/core/transactions/adapters
mkdir -p src/lib/validators
mkdir -p .github/workflows
mkdir -p scripts
```

**Checklist:**

- [ ] Branch backup creado
- [ ] Branch de trabajo creado
- [ ] Estructura de carpetas lista

---

### 🔴 Fase 1: Infraestructura Core (6 horas)

#### 1.1 Implementar Result Pattern (1.5 horas)

**Archivos a crear:**

```bash
src/lib/result/
├── types.ts          # Ok<T>, Err<E>, Result<T, E>
├── helpers.ts        # combine, fromPromise, fromThrowable
├── errors.ts         # AppError types
└── index.ts          # Exports
```

**Código específico:**

**`src/lib/result/types.ts`**

```typescript
export type Result<T, E = Error> = Ok<T> | Err<E>;

export class Ok<T> {
  readonly _tag = "Ok" as const;
  constructor(readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }
  isErr(): this is Err<never> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }

  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }
}

export class Err<E> {
  readonly _tag = "Err" as const;
  constructor(readonly error: E) {}

  isOk(): this is Ok<never> {
    return false;
  }
  isErr(): this is Err<E> {
    return true;
  }

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as any;
  }

  flatMap<U>(_fn: (value: never) => Result<U, E>): Result<U, E> {
    return this as any;
  }

  unwrap(): never {
    throw new Error(`Called unwrap on Err: ${JSON.stringify(this.error)}`);
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }
}

export const ok = <T>(value: T): Ok<T> => new Ok(value);
export const err = <E>(error: E): Err<E> => new Err(error);
```

**`src/lib/result/errors.ts`**

```typescript
export type AppError =
  | ValidationError
  | DatabaseError
  | AuthorizationError
  | NotFoundError
  | NetworkError;

export type ValidationError = {
  type: "VALIDATION";
  field: string;
  message: string;
  constraint?: string;
};

export type DatabaseError = {
  type: "DATABASE";
  operation: "insert" | "update" | "delete" | "select";
  message: string;
  code?: string;
};

export type AuthorizationError = {
  type: "UNAUTHORIZED";
  resource?: string;
};

export type NotFoundError = {
  type: "NOT_FOUND";
  resource: string;
  id: string | number;
};

export type NetworkError = {
  type: "NETWORK";
  status?: number;
  message: string;
};

// Factory functions
export const validationError = (
  field: string,
  message: string,
  constraint?: string,
): ValidationError => ({
  type: "VALIDATION",
  field,
  message,
  constraint,
});

export const databaseError = (
  operation: DatabaseError["operation"],
  message: string,
  code?: string,
): DatabaseError => ({
  type: "DATABASE",
  operation,
  message,
  code,
});

export const authorizationError = (resource?: string): AuthorizationError => ({
  type: "UNAUTHORIZED",
  resource,
});

export const notFoundError = (
  resource: string,
  id: string | number,
): NotFoundError => ({
  type: "NOT_FOUND",
  resource,
  id,
});

export const networkError = (
  message: string,
  status?: number,
): NetworkError => ({
  type: "NETWORK",
  status,
  message,
});
```

**`src/lib/result/helpers.ts`**

```typescript
import { Result, ok, err, Ok } from "./types";

export function combine<T extends readonly Result<any, any>[]>(
  results: T,
): Result<
  { [K in keyof T]: T[K] extends Ok<infer V> ? V : never },
  T[number] extends Result<any, infer E> ? E : never
> {
  const values: any[] = [];
  for (const result of results) {
    if (result.isErr()) return result as any;
    values.push(result.value);
  }
  return ok(values as any);
}

export async function fromPromise<T, E = Error>(
  promise: Promise<T>,
  errorMapper?: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    const mappedError = errorMapper ? errorMapper(error) : (error as E);
    return err(mappedError);
  }
}

export function fromThrowable<T, E = Error>(
  fn: () => T,
  errorMapper?: (error: unknown) => E,
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    const mappedError = errorMapper ? errorMapper(error) : (error as E);
    return err(mappedError);
  }
}
```

**`src/lib/result/index.ts`**

```typescript
export * from "./types";
export * from "./helpers";
export * from "./errors";
```

**Checklist:**

- [ ] Crear src/lib/result/types.ts
- [ ] Crear src/lib/result/errors.ts
- [ ] Crear src/lib/result/helpers.ts
- [ ] Crear src/lib/result/index.ts
- [ ] Compilar sin errores: `npm run build`
- [ ] Crear tests: `src/lib/result/__tests__/result.test.ts`
- [ ] Tests pasando
- [ ] Commit: "feat: implement Result pattern"

---

#### 1.2 Implementar Circuit Breaker (2 horas)

**Archivos a crear:**

```bash
src/lib/circuit-breaker/
├── types.ts              # CircuitState, Config, Metrics
├── circuit-breaker.ts    # Clase CircuitBreaker
├── factory.ts            # createCircuitBreaker, getBreaker
└── index.ts              # Exports
```

**`src/lib/circuit-breaker/types.ts`**

```typescript
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout?: number;
  onStateChange?: (state: CircuitState) => void;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}
```

**`src/lib/circuit-breaker/circuit-breaker.ts`**

```typescript
import { Result, ok, err } from "@/lib/result";
import {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
} from "./types";

export class CircuitBreaker<T, E> {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private readonly config: Required<CircuitBreakerConfig>;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;

  constructor(
    private readonly fn: () => Promise<Result<T, E>>,
    config: CircuitBreakerConfig,
  ) {
    this.config = {
      resetTimeout: 60000,
      onStateChange: () => {},
      ...config,
    };
  }

  async execute(): Promise<
    Result<T, E | { type: "CIRCUIT_OPEN"; nextAttempt: number }>
  > {
    this.totalRequests++;

    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        return err({
          type: "CIRCUIT_OPEN",
          nextAttempt: this.nextAttempt,
        } as any);
      }
      this.transitionTo("HALF_OPEN");
      this.successCount = 0;
    }

    try {
      const result = await this.fn();

      if (result.isErr()) {
        this.onFailure();
        return result;
      }

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return err({ type: "CIRCUIT_OPEN" } as any);
    }
  }

  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo("CLOSED");
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.failureCount >= this.config.failureThreshold) {
      this.transitionTo("OPEN");
      this.nextAttempt = Date.now() + this.config.timeout;
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.config.onStateChange?.(newState);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
  }
}
```

**`src/lib/circuit-breaker/factory.ts`**

```typescript
import { CircuitBreaker } from "./circuit-breaker";
import { CircuitBreakerConfig } from "./types";

const breakers = new Map<string, CircuitBreaker<any, any>>();

export function createCircuitBreaker<T, E>(
  name: string,
  fn: () => Promise<Result<T, E>>,
  config: CircuitBreakerConfig,
): CircuitBreaker<T, E> {
  if (breakers.has(name)) {
    return breakers.get(name)!;
  }

  const breaker = new CircuitBreaker(fn, config);
  breakers.set(name, breaker);
  return breaker;
}

export function getBreaker(name: string): CircuitBreaker<any, any> | undefined {
  return breakers.get(name);
}

export function getAllBreakers(): Map<string, CircuitBreaker<any, any>> {
  return breakers;
}
```

**Checklist:**

- [ ] Crear src/lib/circuit-breaker/types.ts
- [ ] Crear src/lib/circuit-breaker/circuit-breaker.ts
- [ ] Crear src/lib/circuit-breaker/factory.ts
- [ ] Crear src/lib/circuit-breaker/index.ts
- [ ] Compilar sin errores
- [ ] Crear tests básicos
- [ ] Commit: "feat: implement Circuit Breaker pattern"

---

#### 1.3 Implementar Logger System (2.5 horas)

**Archivos a crear:**

```bash
src/lib/logger/
├── types.ts          # LogLevel, LogEntry, Transport
├── transports/
│   ├── console.ts    # ConsoleTransport
│   └── file.ts       # FileTransport (opcional)
├── logger.ts         # Clase Logger
└── index.ts          # Logger singleton + exports
```

**`src/lib/logger/types.ts`**

```typescript
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

export interface Transport {
  log(entry: LogEntry): void;
}

export interface LoggerConfig {
  level: LogLevel;
  transports: Transport[];
  sensitiveFields?: string[];
}
```

**`src/lib/logger/transports/console.ts`**

```typescript
import { Transport, LogEntry } from "../types";

export class ConsoleTransport implements Transport {
  log(entry: LogEntry): void {
    const emoji = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    }[entry.level];

    const message = `${emoji} [${entry.timestamp.toISOString()}] ${entry.message}`;

    if (entry.context) {
      console[entry.level === "debug" ? "log" : entry.level](
        message,
        entry.context,
      );
    } else {
      console[entry.level === "debug" ? "log" : entry.level](message);
    }

    if (entry.error) {
      console.error(entry.error);
    }
  }
}
```

**`src/lib/logger/logger.ts`**

```typescript
import { LogLevel, LogEntry, LoggerConfig, Transport } from "./types";

export class Logger {
  private readonly config: LoggerConfig;
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sensitive = this.config.sensitiveFields || [
      "password",
      "token",
      "secret",
      "apiKey",
      "creditCard",
    ];

    const result = Array.isArray(data) ? [] : {};

    for (const key in data) {
      if (
        sensitive.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        result[key] = "[REDACTED]";
      } else if (typeof data[key] === "object") {
        result[key] = this.sanitize(data[key]);
      } else {
        result[key] = data[key];
      }
    }

    return result;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: context ? this.sanitize(context) : undefined,
      error,
    };

    for (const transport of this.config.transports) {
      transport.log(entry);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log("error", message, context, error);
  }
}
```

**`src/lib/logger/index.ts`**

```typescript
import { Logger } from "./logger";
import { ConsoleTransport } from "./transports/console";

const logger = new Logger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [new ConsoleTransport()],
  sensitiveFields: ["password", "token", "secret", "apiKey"],
});

export { logger };
export * from "./types";
export { Logger } from "./logger";
```

**Checklist:**

- [ ] Crear src/lib/logger/types.ts
- [ ] Crear src/lib/logger/transports/console.ts
- [ ] Crear src/lib/logger/logger.ts
- [ ] Crear src/lib/logger/index.ts
- [ ] Compilar sin errores
- [ ] Crear tests
- [ ] Commit: "feat: implement Logger system"

---

### 🔴 Fase 2: Refactorizar Server Actions (8 horas)

#### 2.1 Migrar transactions.ts a Result Pattern (2 horas)

**Archivo:** `src/core/actions/transactions.ts`

**Antes (ejemplo):**

```typescript
export async function createTransaction(formData: FormData) {
  try {
    const result = await db.insert(transactions).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Failed to create transaction" };
  }
}
```

**Después:**

```typescript
import { Result, ok, err } from "@/lib/result";
import { AppError, databaseError, validationError } from "@/lib/result/errors";
import { logger } from "@/lib/logger";

export async function createTransaction(
  formData: FormData,
): Promise<Result<Transaction, AppError>> {
  // Validación
  const amount = Number(formData.get("amount"));
  if (!amount || amount <= 0) {
    return err(validationError("amount", "Amount must be positive"));
  }

  try {
    const [transaction] = await db
      .insert(transactions)
      .values(data)
      .returning();

    logger.info("Transaction created", { transactionId: transaction.id });
    return ok(transaction);
  } catch (error) {
    logger.error("Failed to create transaction", error as Error, { formData });
    return err(databaseError("insert", "Failed to create transaction"));
  }
}
```

**Checklist:**

- [ ] Refactorizar createTransaction
- [ ] Refactorizar getTransactions
- [ ] Refactorizar updateTransaction
- [ ] Refactorizar deleteTransaction
- [ ] Refactorizar getRelated functions
- [ ] Reemplazar todos los console.error por logger.error
- [ ] Compilar sin errores
- [ ] Tests actualizados
- [ ] Commit: "refactor(transactions): migrate to Result pattern"

---

#### 2.2 Eliminar enhanced-transactions.ts (1 hora)

**Pasos:**

1. Revisar qué funciones únicas tiene enhanced-transactions.ts
2. Migrar funciones únicas a transactions.ts con Result Pattern
3. Eliminar archivo
4. Actualizar imports en componentes

**Checklist:**

- [ ] Identificar funciones únicas en enhanced-transactions.ts
- [ ] Migrar funciones únicas a transactions.ts
- [ ] Actualizar imports en todos los componentes
- [ ] Eliminar src/core/actions/enhanced-transactions.ts
- [ ] Compilar sin errores
- [ ] Tests pasando
- [ ] Commit: "refactor: remove duplicate enhanced-transactions.ts"

---

#### 2.3 Migrar resto de Server Actions (5 horas)

**Archivos a migrar (en orden):**

1. auth.ts (30 min)
2. bank-accounts.ts (1 hora)
3. contacts.ts (1.5 horas)
4. digital-wallets.ts (1 hora)
5. Actualizar componentes que usan estas actions (1 hora)

**Checklist por archivo:**

- [ ] auth.ts → Result Pattern + Logger
- [ ] bank-accounts.ts → Result Pattern + Logger
- [ ] contacts.ts → Result Pattern + Logger
- [ ] digital-wallets.ts → Result Pattern + Logger
- [ ] Actualizar todos los componentes que llaman estas actions
- [ ] Compilar sin errores
- [ ] Tests actualizados
- [ ] Commit: "refactor(actions): migrate all to Result pattern + Logger"

---

### 🟠 Fase 3: Arquitectura 3-Layer para Transactions (4 horas)

#### 3.1 Crear Repository Layer (1.5 horas)

**`src/core/transactions/repository/transaction-repository.ts`**

```typescript
import { Result, ok, err } from "@/lib/result";
import {
  DatabaseError,
  databaseError,
  notFoundError,
} from "@/lib/result/errors";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export class TransactionRepository {
  async create(
    data: InsertTransaction,
  ): Promise<Result<Transaction, DatabaseError>> {
    try {
      const [transaction] = await db
        .insert(transactions)
        .values(data)
        .returning();
      return ok(transaction);
    } catch (error) {
      return err(databaseError("insert", "Failed to create transaction"));
    }
  }

  async findById(id: number): Promise<Result<Transaction, DatabaseError>> {
    try {
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id));

      if (!transaction) {
        return err(notFoundError("Transaction", id));
      }

      return ok(transaction);
    } catch (error) {
      return err(databaseError("select", "Failed to find transaction"));
    }
  }

  async findAll(userId: string): Promise<Result<Transaction[], DatabaseError>> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));
      return ok(result);
    } catch (error) {
      return err(databaseError("select", "Failed to fetch transactions"));
    }
  }

  // ... más métodos (update, delete, etc.)
}

export const transactionRepository = new TransactionRepository();
```

**Checklist:**

- [ ] Crear src/core/transactions/repository/transaction-repository.ts
- [ ] Implementar CRUD básico
- [ ] Implementar queries complejas
- [ ] Tests unitarios
- [ ] Commit: "feat(transactions): add repository layer"

---

#### 3.2 Crear Service Layer (1.5 horas)

**`src/core/transactions/service/transaction-service.ts`**

```typescript
import { Result, ok } from "@/lib/result";
import { AppError, validationError } from "@/lib/result/errors";
import { transactionRepository } from "../repository/transaction-repository";
import { logger } from "@/lib/logger";

export class TransactionService {
  async createTransaction(
    data: CreateTransactionDto,
  ): Promise<Result<Transaction, AppError>> {
    // Validación
    if (data.amount <= 0) {
      return err(validationError("amount", "Amount must be positive"));
    }

    // Business logic
    const result = await transactionRepository.create({
      ...data,
      createdAt: new Date(),
    });

    if (result.isErr()) {
      return result;
    }

    // Post-processing
    logger.info("Transaction created successfully", {
      transactionId: result.value.id,
    });

    return result;
  }

  // ... más métodos
}

export const transactionService = new TransactionService();
```

**Checklist:**

- [ ] Crear src/core/transactions/service/transaction-service.ts
- [ ] Implementar business logic
- [ ] Integrar con repository
- [ ] Tests unitarios
- [ ] Commit: "feat(transactions): add service layer"

---

#### 3.3 Actualizar Server Actions (1 hora)

**`src/core/actions/transactions.ts` (simplificado)**

```typescript
"use server";

import { transactionService } from "@/core/transactions/service/transaction-service";

export async function createTransaction(formData: FormData) {
  const result = await transactionService.createTransaction({
    amount: Number(formData.get("amount")),
    description: formData.get("description") as string,
    // ...
  });

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
    };
  }

  return {
    success: true,
    data: result.value,
  };
}
```

**Checklist:**

- [ ] Simplificar transactions.ts usando service
- [ ] Actualizar todos los actions
- [ ] Tests de integración
- [ ] Commit: "refactor(transactions): use 3-layer architecture"

---

### 🟠 Fase 4: Optimizar Hooks y Estado (3 horas)

#### 4.1 Crear State Machine para TransactionForm (2 horas)

**`src/components/transactions/TransactionForm.machine.ts`**

```typescript
type TransactionFormState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "submitting" }
  | { status: "success"; data: Transaction }
  | { status: "error"; error: string };

type TransactionFormAction =
  | { type: "SUBMIT" }
  | { type: "VALIDATE" }
  | { type: "SUCCESS"; data: Transaction }
  | { type: "ERROR"; error: string }
  | { type: "RESET" };

export function transactionFormReducer(
  state: TransactionFormState,
  action: TransactionFormAction,
): TransactionFormState {
  switch (state.status) {
    case "idle":
      if (action.type === "VALIDATE") return { status: "validating" };
      return state;

    case "validating":
      if (action.type === "SUBMIT") return { status: "submitting" };
      if (action.type === "ERROR")
        return { status: "error", error: action.error };
      return state;

    case "submitting":
      if (action.type === "SUCCESS")
        return { status: "success", data: action.data };
      if (action.type === "ERROR")
        return { status: "error", error: action.error };
      return state;

    case "success":
    case "error":
      if (action.type === "RESET") return { status: "idle" };
      return state;

    default:
      return state;
  }
}
```

**`src/components/transactions/useTransactionForm.ts`**

```typescript
import { useReducer } from "react";
import { transactionFormReducer } from "./TransactionForm.machine";

export function useTransactionForm() {
  const [state, dispatch] = useReducer(transactionFormReducer, {
    status: "idle",
  });

  const submit = async (data: FormData) => {
    dispatch({ type: "VALIDATE" });

    // Validación
    // ...

    dispatch({ type: "SUBMIT" });

    const result = await createTransaction(data);

    if (result.success) {
      dispatch({ type: "SUCCESS", data: result.data });
    } else {
      dispatch({ type: "ERROR", error: result.error });
    }
  };

  return {
    state,
    submit,
    reset: () => dispatch({ type: "RESET" }),
  };
}
```

**Checklist:**

- [ ] Crear TransactionForm.machine.ts
- [ ] Crear useTransactionForm.ts
- [ ] Refactorizar TransactionForm.tsx
- [ ] Tests
- [ ] Commit: "refactor(transactions): add state machine"

---

### 🟠 Fase 5: Limpiar y Organizar (4 horas)

#### 5.1 Limpiar console.\* (1 hora)

**Pasos:**

1. Buscar todos los console.\* en src/
2. Reemplazar console.error por logger.error
3. Reemplazar console.log por logger.debug
4. Eliminar console.log de archivos de ejemplo (o dejarlo con comentario)

**Script de ayuda:**

```bash
# Buscar todos los console.*
grep -r "console\." src/ --exclude-dir=node_modules

# Reemplazar automáticamente (con cuidado)
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.error/logger.error/g'
```

**Checklist:**

- [ ] Identificar todos los console.\* (44 totales)
- [ ] Reemplazar por logger en archivos de producción
- [ ] Mantener en archivos de ejemplo con comentario
- [ ] Agregar regla ESLint: no-console error
- [ ] Compilar sin errores
- [ ] Commit: "refactor: replace console.\* with logger"

---

#### 5.2 Organizar Imports (1 hora)

**Instalar plugins:**

```bash
npm install -D eslint-plugin-simple-import-sort eslint-plugin-import
```

**Actualizar `eslint.config.mjs`:**

```javascript
import simpleImportSort from "eslint-plugin-simple-import-sort";
import importPlugin from "eslint-plugin-import";

export default [
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      import: importPlugin,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
    },
  },
];
```

**Aplicar:**

```bash
npm run lint:fix
```

**Checklist:**

- [ ] Instalar plugins
- [ ] Actualizar eslint.config.mjs
- [ ] Ejecutar lint:fix
- [ ] Verificar que compile
- [ ] Commit: "style: organize imports"

---

#### 5.3 Detectar archivos no usados (1 hora)

**Instalar herramienta:**

```bash
npm install -D next-unused
```

**Ejecutar:**

```bash
npx next-unused
```

**Analizar resultados y eliminar:**

- Archivos de ejemplo (mover a carpeta examples/)
- Archivos realmente sin usar

**Checklist:**

- [ ] Instalar next-unused
- [ ] Ejecutar análisis
- [ ] Revisar resultados
- [ ] Mover ejemplos a examples/
- [ ] Eliminar archivos confirmados como sin usar
- [ ] Compilar sin errores
- [ ] Commit: "chore: remove unused files"

---

#### 5.4 Configurar Dependabot (1 hora)

**Crear `.github/dependabot.yml`:**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "jcrod"
    labels:
      - "dependencies"
      - "automated"
```

**Checklist:**

- [ ] Crear .github/dependabot.yml
- [ ] Push a GitHub
- [ ] Verificar que se active
- [ ] Commit: "ci: add dependabot config"

---

### 🟡 Fase 6: Documentación (2 horas)

#### 6.1 Consolidar documentación (1.5 horas)

**Script `scripts/consolidate-docs.js`:**

```javascript
const fs = require("fs-extra");
const path = require("path");

const docs = {
  "docs/README.md": ["README.md", "QUICKSTART.md", "START_HERE.md"],
  "docs/ARCHITECTURE.md": ["ARCHITECTURE_MAP.md", "DESIGN_PATTERNS_GUIDE.md"],
  "docs/MIGRATION.md": [
    "MIGRATION_SUMMARY.md",
    "THEME_MIGRATION_GUIDE.md",
    "SYSTEM_UPGRADE_GUIDE.md",
  ],
  "docs/IMPLEMENTATION.md": [
    "IMPLEMENTATION_SUMMARY.md",
    "ADVANCED_RECOMMENDATIONS.md",
    "COMPLETION_CHECKLIST.md",
    "ANALISIS_Y_SOLUCIONES_OPTIMIZADAS.md",
    "PLAN_IMPLEMENTACION.md",
  ],
};

// ... implementación
```

**Checklist:**

- [ ] Crear scripts/consolidate-docs.js
- [ ] Ejecutar script
- [ ] Revisar docs/ generados
- [ ] Eliminar archivos viejos de raíz
- [ ] Actualizar README.md principal
- [ ] Commit: "docs: consolidate documentation"

---

#### 6.2 Actualizar README principal (30 min)

**Checklist:**

- [ ] Actualizar README.md con instrucciones claras
- [ ] Agregar badges (build status, coverage, etc.)
- [ ] Documentar patrones implementados
- [ ] Commit: "docs: update main README"

---

## 📊 RESUMEN DE IMPLEMENTACIÓN

### Tiempo Total Estimado

| Fase                    | Duración       | Prioridad  |
| ----------------------- | -------------- | ---------- |
| 0. Preparación          | 30 min         | -          |
| 1. Infraestructura Core | 6 horas        | 🔴 CRÍTICA |
| 2. Server Actions       | 8 horas        | 🔴 CRÍTICA |
| 3. Arquitectura 3-Layer | 4 horas        | 🟠 ALTA    |
| 4. Hooks y Estado       | 3 horas        | 🟠 ALTA    |
| 5. Limpiar y Organizar  | 4 horas        | 🟠 ALTA    |
| 6. Documentación        | 2 horas        | 🟡 MEDIA   |
| **TOTAL**               | **27.5 horas** | -          |

### Distribución Sugerida

- **Día 1** (8h): Fase 0 + Fase 1 completa (6.5h total)
- **Día 2** (8h): Fase 2 completa (Server Actions)
- **Día 3** (8h): Fase 3 (3-Layer) + Fase 4 (Hooks)
- **Día 4** (3.5h): Fase 5 + Fase 6

**Total: 3.5 días de trabajo**

---

## ✅ CHECKLIST MASTER

### Infraestructura

- [ ] Result Pattern implementado
- [ ] Circuit Breaker implementado
- [ ] Logger System implementado
- [ ] 3-Layer Architecture implementada

### Migraciones

- [ ] transactions.ts migrado
- [ ] enhanced-transactions.ts eliminado
- [ ] auth.ts migrado
- [ ] bank-accounts.ts migrado
- [ ] contacts.ts migrado
- [ ] digital-wallets.ts migrado

### Limpieza

- [ ] 44 console.\* reemplazados
- [ ] Imports organizados
- [ ] Archivos sin usar eliminados
- [ ] Dependabot configurado

### Optimizaciones

- [ ] TransactionForm con state machine
- [ ] Hooks optimizados
- [ ] resultado Performance antes/después medido

### Documentación

- [ ] Docs consolidados
- [ ] README actualizado
- [ ] Patrones documentados

---

## 🎯 CRITERIOS DE ÉXITO

1. ✅ **Build exitoso**: `npm run build` sin errores
2. ✅ **Tests pasando**: `npm run test` (si hay tests)
3. ✅ **Type Coverage**: 100% (sin `any`)
4. ✅ **Zero console.\* en producción**
5. ✅ **Documentación actualizada**
6. ✅ **Métricas mejoradas**:
   - Líneas de código: -1,690
   - Bundle size: -15%
   - Re-renders: -70%
   - Errores runtime: -90%

---

**🎉 ¿Listo para empezar? Siguiente paso: Fase 0 - Preparación**
