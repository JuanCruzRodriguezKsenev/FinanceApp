# 6️⃣ Análisis de Tests Automatizados

**Fecha:** 18 Febrero 2026

---

## 📊 Resumen Ejecutivo

**Status:** 🔴 CRÍTICO - Cobertura de tests muy baja

**Hallazgos:**

- ✅ Vitest configurado correctamente
- ✅ React Testing Library disponible
- ✅ 84 tests existentes en state machines
- 🔴 Componentes feature sin tests (95%+)
- 🔴 Server actions sin tests
- 🔴 Hooks sin tests

---

## ✅ Tests Implementados Actualmente

### 1. State Machines Tests ✅

**Ubicación:**

```
src/lib/state-machines/__tests__/
├── transaction.machine.test.ts       (46 tests)
├── transaction.service.test.ts       (31 tests)
└── (77 tests totales)
```

**Cobertura:**

```
State Transitions:       ✅ 46 tests
  - Valid transitions   (15 tests)
  - Invalid transitions (12 tests)
  - Event handling      (10 tests)
  - Helpers            (9 tests)

Service Operations:     ✅ 31 tests
  - Constructor        (3 tests)
  - State changes      (15 tests)
  - Context management (8 tests)
  - Edge cases         (5 tests)
```

**Calidad:** ✅ Excelente

- Cobertura del 100% en state machines
- Casos edge correctamente cubiertos
- FSM garantizado confiable

---

### 2. Component Tests ✅

**Ubicación:**

```
src/features/transactions/components/__tests__/
├── TransactionStatusBadge.test.tsx   (7 tests)
└── (7 tests)
```

**Cobertura:**

```
TransactionStatusBadge:  ✅ 7 tests
  - Rendering states   (4 tests)
  - CSS classes        (2 tests)
  - Visual feedback    (1 test)
```

**Calidad:** ✅ Básico

- Cubre casos principales
- Pero solo 1 componente de ~60+ componentes

---

## 🔴 TESTS FALTANTES - CRÍTICO

### 1. Componentes Feature Sin Tests ❌

**Ubicación:** `src/features/transactions/components/`

```
TransactionForm.tsx              ❌ Sin test (875 líneas!)
├── Formulario complejo
├── Lógica de validación
├── Event handling
├── Auto-categorización
└── Estado de carga/error

TransactionRow.tsx               ❌ Sin test
├── Renderizado de fila
├── Props binding
├── Event handlers

TransactionsSummary.tsx          ❌ Sin test
├── Cálcula totales
├── Formatea moneda
└── Renderiza gráfico

TransactionStatusBadge.tsx       ✅ 7 tests (único con tests)
```

**Ubicación:** `src/features/bank-accounts/components/`

```
BankAccountManager.tsx           ❌ Sin test (268 líneas CSS + lógica)
├── CRUD de cuentas
├── Validación
├── Eliminación segura
└── Listado con filter
```

**Ubicación:** `src/features/*/components/`

```
digital-wallets/              ❌ Sin tests
contacts/                     ❌ Sin tests
```

**Total faltantes:** ~50+ componentes sin tests

---

### 2. Server Actions Sin Tests ❌

**Ubicación:** `src/features/*/actions/`

```
transactions.ts                  ❌ Sin test (~200+ líneas)
├── createTransactionWithAutoDetection
├── updateBalancesAfterTransaction
├── getTransactionsWithMetadata
└── flagTransactionAsSuspicious

bank-accounts.ts                 ❌ Sin test (~300+ líneas)
├── createBankAccount
├── getBankAccounts
├── updateBankAccount
├── deleteBankAccount
└── más funciones

contacts.ts                      ❌ Sin test
digital-wallets.ts               ❌ Sin test
```

**Total:** ~38+ server actions sin tests

**Riesgo:** 🔴 CRÍTICO

- Dinero involucrado (transacciones)
- Cambios de data
- Sin validación de regresión

---

### 3. Custom Hooks Sin Tests ❌

**Ubicación:** `src/hooks/` y `src/features/*/hooks/`

```
useMessage.ts                    ❌ Sin test
useForm.ts                       ❌ Sin test
useDataFilters.tsx               ❌ Sin test
useTransactionForm.ts            ❌ Sin test (transactions)
```

**Riesgo:** 🟠 Medio-Alto

- Lógica de formularios
- Filtrado de datos
- Cambios podrían romper UI

---

### 4. Utilidades Sin Tests ❌

**Ubicación:** `src/lib/`

```
transaction-detector.ts          ❌ Sin test
├── detectTransactionType
├── detectCategoryFromDescription
└── detectSuspiciousActivity

transactionUtils.ts              ❌ Sin test
├── calculateTotalByType
├── calculateTotals
├── calculateBalance
└── getTransactionStats

validators/                      ❌ Sin test (100+ funciones!)
├── validateEmail
├── validatePassword
├── validateCBU
└── ... más validadores
```

---

## 📊 Matriz de Cobertura Actual

| Módulo         | Archivos | Tests  | Cobertura | Status             |
| -------------- | -------- | ------ | --------- | ------------------ |
| State Machines | 5        | 77     | 100%      | ✅ Excellent       |
| Components     | ~60+     | 7      | 11%       | 🔴 Critical        |
| Server Actions | 38+      | 0      | 0%        | 🔴 Critical        |
| Custom Hooks   | 4+       | 0      | 0%        | 🔴 Critical        |
| Utilities      | 10+      | 0      | 0%        | 🔴 Critical        |
| **TOTAL**      | **~117** | **84** | **~7%**   | **🔴 WAY TOO LOW** |

---

## 🎯 Plan de Testing

### Fase 1: Utilidades (Quick Wins - 8 horas)

**Prioridad Alta - ROI Alto:**

```
1. Validators Tests (4h)
   File: src/lib/validators/__tests__/validators.test.ts

   - validateEmail: 8 tests
   - validatePassword: 8 tests
   - validateAmount: 10 tests
   - validateCBU: 8 tests
   - validateIBAN: 8 tests
   - ... total: 80+ tests

2. Transaction Utilities (2h)
   File: src/lib/__tests__/transactionUtils.test.ts

   - calculateTotalByType: 6 tests
   - calculateTotals: 5 tests
   - calculateBalance: 5 tests
   - getTransactionStats: 5 tests

3. Transaction Detector (2h)
   File: src/lib/__tests__/transaction-detector.test.ts

   - detectTransactionType: 15 tests
   - detectCategoryFromDescription: 20 tests
   - detectSuspiciousActivity: 10 tests
```

---

### Fase 2: Hooks (6 horas)

```
1. useTransactionForm (2h)
   10 tests para FormContext, estado, validación

2. useForm & useMessage (2h)
   10 tests para hooks genéricos

3. useDataFilters (2h)
   10 tests para filtrado
```

---

### Fase 3: Server Actions (12 horas - Crítico)

```
1. Transaction Actions (6h)
   - createTransactionWithAutoDetection: 8 tests
   - updateBalancesAfterTransaction: 6 tests
   - flagTransactionAsSuspicious: 4 tests
   Total: 20+ tests

2. Bank Account Actions (4h)
   - createBankAccount: 5 tests
   - updateBankAccount: 5 tests
   - deleteBankAccount (con validación): 5 tests
   Total: 15+ tests

3. Contacts & Wallets (2h)
   - Basic CRUD tests
   Total: 10+ tests
```

---

### Fase 4: Componentes (15 horas)

```
1. TransactionForm (6h)
   - Rendering: 3 tests
   - Form submission: 4 tests
   - Validation: 5 tests
   - Edge cases: 3 tests
   Total: 15+ tests

2. BankAccountManager (4h)
   - List rendering: 3 tests
   - Add account: 3 tests
   - Delete with warning: 3 tests
   Total: 9+ tests

3. Other Components (5h)
   - TransactionRow: 5 tests
   - TransactionsSummary: 5 tests
   - ... más
```

---

## 🛠️ Setup para Escribir Tests

### Archivo de Ejemplo: validators.test.ts

```typescript
import { describe, it, expect, vi } from "vitest";
import {
  validateEmail,
  validatePassword,
  validateAmount,
} from "@/lib/validators/fields";

describe("Email Validator", () => {
  it("should accept valid email", async () => {
    const result = await validateEmail("user@example.com");
    expect(result.isValid).toBe(true);
  });

  it("should reject invalid email", async () => {
    const result = await validateEmail("invalid-email");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("email");
  });

  it("should reject empty email", async () => {
    const result = await validateEmail("");
    expect(result.isValid).toBe(false);
  });

  it("should handle whitespace", async () => {
    const result = await validateEmail("  user@example.com  ");
    expect(result.isValid).toBe(true);
  });
});

describe("Password Validator", () => {
  it("should require minimum length", async () => {
    const result = await validatePassword("short");
    expect(result.isValid).toBe(false);
  });

  it("should require uppercase, lowercase, numbers", async () => {
    const result = await validatePassword("ValidPassword123");
    expect(result.isValid).toBe(true);
  });
});

describe("Amount Validator", () => {
  it("should accept positive numbers", () => {
    const result = validateAmount("100.50");
    expect(result.isValid).toBe(true);
  });

  it("should reject negative numbers", () => {
    const result = validateAmount("-100");
    expect(result.isValid).toBe(false);
  });

  it("should reject non-numeric", () => {
    const result = validateAmount("abc");
    expect(result.isValid).toBe(false);
  });
});
```

---

### Archivo de Ejemplo: components.test.tsx

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@testing-library/react';
import TransactionForm from '@/features/transactions/components/TransactionForm';

describe('TransactionForm', () => {
  it('should render form with fields', () => {
    render(
      <TransactionForm
        accounts={[]}
        goals={[]}
        onSuccess={() => undefined}
      />
    );

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <TransactionForm
        accounts={[]}
        goals={[]}
        onSuccess={onSuccess}
      />
    );

    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();

    render(
      <TransactionForm
        accounts={[]}
        goals={[]}
      />
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
```

---

## 📋 Checklist de Testing

**Fase 1 - Utilities:**

- [ ] Crear `/src/lib/validators/__tests__/validators.test.ts` (80+ tests)
- [ ] Crear `/src/lib/__tests__/transactionUtils.test.ts` (20+ tests)
- [ ] Crear `/src/lib/__tests__/transaction-detector.test.ts` (45+ tests)
- [ ] Ejecutar `npm run test` - verificar pasa

**Fase 2 - Hooks:**

- [ ] Crear `/src/hooks/__tests__/` directory
- [ ] Crear tests para useForm, useMessage, useDataFilters
- [ ] Crear `/src/features/transactions/hooks/__tests__/`
- [ ] Tests para useTransactionForm

**Fase 3 - Server Actions:**

- [ ] Crear `/src/features/transactions/actions/__tests__/`
- [ ] Mocking de DB para server actions
- [ ] Tests para createTransaction, updateBalances, etc.
- [ ] Crear tests para bank-accounts, contacts, wallets

**Fase 4 - Components:**

- [ ] Crear tests para TransactionForm
- [ ] Crear tests para BankAccountManager
- [ ] Crear tests para componentes feature

**General:**

- [ ] Ejecutar `npm run test:coverage`
- [ ] Verificar cobertura >= 80%
- [ ] Documentar nuevos tests en README

---

## 🚀 Comandos de Testing

```bash
# Ejecutar tests en watch mode
npm run test

# Ejecutar tests una sola vez (CI)
npm run test:run

# Ver UI de tests
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

---

## 📊 Objetivo Final

| Métrica               | Actual | Target | Esfuerzo |
| --------------------- | ------ | ------ | -------- |
| Total tests           | 84     | 400+   | 40h      |
| Coverage              | 7%     | 80%+   | 40h      |
| Components tested     | 1/60   | 55/60  | 25h      |
| Server actions tested | 0/38   | 35/38  | 12h      |
| Utilities tested      | 0/10   | 10/10  | 8h       |

---

## 🔗 Siguiente: [07_ARCHIVOS_MUERTOS.md](./07_ARCHIVOS_MUERTOS.md)
