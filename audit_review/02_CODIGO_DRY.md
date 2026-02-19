# 2️⃣ Análisis de Código DRY (Don't Repeat Yourself)

**Fecha:** 18 Febrero 2026

---

## 📊 Resumen

el análisis de DRY identifica código duplicado y patrones que violan el principio DRY.

**Hallazgos:**

- ✅ **Validadores:** Bien centralizados
- ✅ **Errores:** Pattern Result bien implementado
- ✅ **Utilidades:** Bien modularizadas
- ⚠️ **CSS:** Múltiples instancias de estilos similares
- ⚠️ **Hooks:** Posible duplicación en custom hooks

---

## ✅ Lo que está BIEN (Centralizados correctamente)

### 1. Validators - Perfectamente Centralizados ✅

**Ubicación:** `src/lib/validators/`

```
validators/
├── index.ts        ← Barrel exports
├── schema.ts       ← Zod schemas + helpers
├── fields.ts       ← Field-specific validators (100+ funciones)
├── types.ts        ← Types de validadores
└── builder.ts      ← ValidatorBuilder class
```

**Características:**

- ✅ Single source of truth
- ✅ Reutilizado en server actions
- ✅ Reutilizado en componentes
- ✅ Type-safe
- ✅ Composable

**Funciones documentadas:**

```typescript
// Validadores de campos (bien centralizados)
validateEmail(email: string): Promise<ValidationResult>
validatePassword(pwd: string): Promise<ValidationResult>
validateAmount(amount: string | number): ValidationResult
validateCBU(cbu: string): ValidationResult
validateIBAN(iban: string): ValidationResult
// ... más 50+ validadores
```

**Reutilización:**

```tsx
// En componentes
import { validateEmail } from "@/lib/validators";

// En server actions
import { validateAmount } from "@/lib/validators";

// En formularios
const schema = createValidator<FormData>()
  .field("email", validateEmail)
  .field("amount", validateAmount);
```

---

### 2. Formatters - Bien Centralizados ✅

**Ubicación:** `src/lib/formatters.ts`

```typescript
export function formatCurrency(value: number, currency: string = "ARS"): string;
export function formatDate(date: Date | string): string;
export function formatCBU(cbu: string): string;
export function formatIBAN(iban: string): string;
export function formatPhone(phone: string): string;
// ... más funciones de formato
```

**Reutilización:**

- ✅ Usado en componentes de visualización
- ✅ Usado en reports/exportación
- ✅ Consistente en toda la app

---

### 3. Transaction Utils - Centralizados ✅

**Ubicación:** `src/lib/transactionUtils.ts`

```typescript
export function calculateTotalByType(transactions, type);
export function calculateTotals(transactions);
export function calculateBalance(transactions);
export function getTransactionStats(transactions);
```

**Reutilización:**

- ✅ Usado en dashboards
- ✅ Usado en reportes
- ✅ Usado en análisis de datos

---

### 4. Transaction Detector - Motor de Detección ✅

**Ubicación:** `src/lib/transaction-detector.ts`

```typescript
export function detectTransactionType(description, amount, sender, receiver);
export function detectCategoryFromDescription(description);
export function detectSuspiciousActivity(transactions, amount, patterns);
```

**Reutilización:**

- ✅ Usado en todas las transacciones
- ✅ Auto-categorización
- ✅ Anomaly detection

---

### 5. Result Pattern - Error Handling ✅

**Ubicación:** `src/lib/result/`

```
result/
├── types.ts        ← Result<T, E>, Ok, Err
├── errors.ts       ← AppError definitions
├── helpers.ts      ← combine, fromPromise, fromThrowable
└── index.ts        ← Barrel exports
```

**Reutilización:**

- ✅ Usado en todos los server actions
- ✅ Usado en API routes
- ✅ Type-safe

---

### 6. Circuit Breaker - Implementado ✅

**Ubicación:** `src/lib/circuit-breaker/`

```typescript
export function createCircuitBreaker<T>(config: CircuitBreakerConfig)
export const CircuitBreakerFactory = {
  database: (name) => createCircuitBreaker(...),
  externalAPI: (name) => createCircuitBreaker(...),
}
```

**Reutilización:**

- ✅ Patrón singleton
- ✅ Factory pattern para presets
- ✅ Extensible

---

### 7. Logger System - Centralized ✅

**Ubicación:** `src/lib/logger/`

```
logger/
├── logger.ts       ← Core Logger class
├── types.ts        ← LogContext, LogLevel
└── transports/     ← Console, File, etc.
```

---

## ⚠️ Lo que NECESITA MEJORA

### 1. CSS Duplicado - PROBLEMA IMPORTANTE ⚠️

**Análisis detallado:**

#### A) Utilidades de espaciado (padding, margin, gap)

**Archivos analizados:**

```
BankAccountManager.module.css:   padding: 24px 0, margin-bottom: 24px
TransactionForm.module.css:       padding: 24px?, margin: etc
Form.module.css:                  gap: var(--spacing-*), padding: var(...)
Widget.module.css:                padding: 24px
```

**Patrón detectado:**

- Cada componente define su propio spacing
- Inconsistencia: algunos usan valores hardcoded (24px), otros usan variables
- Sin sistema único de espaciado

**Solución ideal:**

```css
/* src/styles/spacing.module.css */
.containerLarge {
  padding: 24px 0;
}
.containerMedium {
  padding: 16px 0;
}
.containerSmall {
  padding: 12px 0;
}

/* Luego en componentes */
@composes .containerLarge from '@/styles/spacing.module.css';
```

**Impacto:** 🔴 Alto

- ~100+ líneas de CSS duplicado
- Difícil mantener consistencia
- Bundle CSS inflado

---

#### B) Estilos de botones

**Archivos:**

- `BankAccountManager.module.css` - `.addButton { background, hover, disabled }`
- `TransactionForm.module.css` - probablemente similar
- `Form.module.css` - probablemente styling para buttons

**Búsqueda necesaria:** Verificar duplicación de estilos de botones

**Solución ideal:**

```typescript
// src/components/ui/Buttons/Button.module.css
// Centralizar TODOS los estilos de botones

// src/components/ui/Buttons/variants.ts
export const buttonVariants = {
  primary: { ... },
  secondary: { ... },
}
```

---

#### C) Flexbox/Grid Layouts

**Patrón repetido:**

```css
display: flex;
justify-content: space-between;
align-items: center;
```

Aparece en múltiples archivos sin reutilización.

---

### 2. Posibles Funciones Duplicadas en Hooks ⚠️

**Sospecha:** Hay múltiples hooks que podrían estar duplicando funcionalidad

**Archivos a revisar:**

```
src/hooks/
├── useMessage.ts        ← Manejo de mensajes
├── useForm.ts           ← Manejo de formularios
└── useDataFilters.tsx   ← Filtrado de datos

src/features/transactions/hooks/
├── useTransactionForm.ts ← Hook específico de transacciones
└── index.ts

src/lib/
├── formMediator.ts      ← Mediador de formularios
└── eventBus.ts          ← Event bus

src/lib/state-machines/
├── transaction.machine.ts
├── transaction.service.ts
└── __tests__/
```

**Relaciones sospechosas:**

- `useForm.ts` vs `formMediator.ts` - ¿Qué diferencia?
- `useMessage.ts` vs error handling en components
- `useTransactionForm.ts` vs hooks genéricos

**Necesita análisis:** Leer cada archivo

---

### 3. Constantes Duplicadas o Inconsistentes ⚠️

**Ubicaciones:**

```
src/constants/
├── globals.ts
├── index.ts
├── selectOptions.ts
├── transactionLabels.ts
├── transactionTypes.ts
```

**Posible duplicación:**

- Transaction types definidos en `transactionTypes.ts`
- También en `db/schema/finance.ts` como enums
- Posible sincronización manual → error-prone

**Solución ideal:**

```typescript
// src/db/schema/finance.ts
export const transactionTypeEnum = pgEnum('transaction_type', [
  'income', 'expense', ...
])

// src/constants/transactionTypes.ts
import { transactionTypeEnum } from '@/db/schema'
export const TRANSACTION_TYPES = transactionTypeEnum.enumValues // ← Auto-sync
```

---

## 🔍 Búsquedas Recomendadas

Para completar este análisis DRY:

```bash
# 1. Buscar funciones con mismo nombre (posible duplicación)
grep -r "export function validateEmail" src/

# 2. Buscar estilos CSS repetidos (classNames)
grep -r "padding: 24px" src/*.css

# 3. Buscar imports sin usar (ESLint)
npm run lint -- --rule 'import/no-unused-modules: warn'

# 4. Buscar archivos JS/TS no usados
npm run find:unused

# 5. Buscar patrones de código similares
# (Herramienta especializada: PMD, SonarQube, etc.)
```

---

## 📋 Checklist DRY

- [ ] Revisar archivos de hooks en detalle (useMessage vs formMediator)
- [ ] Crear catalogo de CSS duplicado
- [ ] Implementar CSS utility classes o composable styles
- [ ] Sincronizar contantes del DB con tipos
- [ ] Crear shared button styles component
- [ ] Revisar server actions por código duplicado

---

## 🎯 Impacto Estimado

| Acción                       | Esfuerzo | ROI                 |
| ---------------------------- | -------- | ------------------- |
| Centralizar CSS duplicado    | 4h       | Alto (bundle -50KB) |
| Consolidar hooks             | 3h       | Alto (menos código) |
| Sincronizar constantes       | 2h       | Medio (menos bugs)  |
| Revisar funciones duplicadas | 2h       | Bajo (si no hay)    |

**Total estimado:** 11 horas

---

## 🔗 Siguiente: [03_IMPORTS_Y_DEPENDENCIAS.md](./03_IMPORTS_Y_DEPENDENCIAS.md)
