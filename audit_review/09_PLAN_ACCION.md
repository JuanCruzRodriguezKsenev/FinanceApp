# 9️⃣ Plan de Acción - Priorizado y Detallado

**Fecha:** 18 Febrero 2026  
**Estimación Total:** 60-70 horas  
**Equipo:** 1 Desarrollador (2-3 semanas a tiempo completo)

---

## 🎯 Estrategia General

```
SEMANA 1: Quick Wins + Testing (30h)
  ├─ Tests críticos (25h)
  ├─ Documentación inline (5h)
  └─ Verificar todo funciona

SEMANA 2: Arquitectura + CSS (25h)
  ├─ Reorganizar componentes (1h)
  ├─ Consolidar CSS (6h)
  ├─ Archivos muertos (4h)
  ├─ Documentación adicional (5h)
  ├─ Final cleanup (5h)
  └─ Build/test completo

SEMANA 3 (opcional): Polish (15h)
  ├─ Reorganizar lib/ (3h)
  ├─ Create README en features (4h)
  ├─ Performance audit (5h)
  └─ Ci/CD improvements (3h)
```

---

## 🔴 PRIORIDAD 1 - CRÍTICA (Hacer Primero!)

### 1.1 Implementar Tests en Server Actions ⭐⭐⭐⭐⭐

**Por qué:** Dinero involucrado, cambios de data, riesgo de BUGS EN PRODUCCIÓN

**Estimación:** 12 horas  
**Esfuerzo:** Alto  
**ROI:** CRÍTICO

**Tareas:**

```
1. Crear estructura de tests (/src/features/*/actions/__tests__/)
2. Tests para createTransactionWithAutoDetection (6h)
   - Validación exitosa
   - Error de validación
   - Idempotencia (mismo key = mismo resultado)
   - DB failure

3. Tests para updateBalancesAfterTransaction (3h)
   - Cálculo correcto de saldos
   - Transacciones múltiples

4. Tests para bank-accounts.ts (3h)
   - CRUD operations
   - Validaciones

Total: 12h
```

**Checklist:**

- [ ] Crear `/src/features/transactions/actions/__tests__/`
- [ ] Crear `transactions.test.ts` con setup de DB mock
- [ ] Crear tests para cada server action
- [ ] Ejecutar `npm run test` - todos pasen
- [ ] Verificar cobertura >= 80% para actions

---

### 1.2 Tests en Componentes Principales ⭐⭐⭐⭐

**Por qué:** Componentes grandes sin cobertura = riesgo de regresión

**Estimación:** 15 horas  
**Esfuerzo:** Alto  
**ROI:** Muy Alto

**Tareas:**

```
1. TransactionForm (6h)
   - Rendering correcto
   - Form submission
   - Validaciones
   - Error handling

2. BankAccountManager (4h)
   - Listado
   - Agrega cuenta
   - Elimina cuenta
   - Validaciones

3. Componentes feature (5h)
   - TransactionRow
   - TransactionsSummary

Total: 15h
```

**Checklist:**

- [ ] Crear `/src/features/transactions/components/__tests__/`
- [ ] Crear `TransactionForm.test.tsx`
- [ ] Crear `/src/features/bank-accounts/components/__tests__/`
- [ ] Crear `BankAccountManager.test.tsx`
- [ ] Todos los tests pasen

---

### 1.3 Tests en Utilities (Validators + Helpers) ⭐⭐⭐

**Por qué:** Base de toda validación

**Estimación:** 8 horas  
**Esfuerzo:** Medio  
**ROI:** Alto

**Tareas:**

```
1. Validators (4h)
   - validateEmail, password, amount, CBU, IBAN
   - ~80 tests

2. Utilities (2h)
   - calculateTotalByType
   - calculateBalance
   - getTransactionStats
   - ~20 tests

3. TransactionDetector (2h)
   - detectType, detectCategory, detectSuspicious
   - ~45 tests

Total: 8h
```

**Checklist:**

- [ ] Crear `/src/lib/validators/__tests__/`
- [ ] Crear `/src/lib/__tests__/`
- [ ] Crear tests para 100+ funcs validación
- [ ] Crear tests para 45+ funcs detección

---

## 🟠 PRIORIDAD 2 - ALTA (Semana 1, después tests)

### 2.1 Agregar JSDoc a Componentes 🎯

**Estimación:** 5 horas  
**Esfuerzo:** Bajo  
**ROI:** Medio (Mantenibilidad)

**Trabajo:**

```
1. TransactionForm.tsx (1h)
   - Componente: descripción + ejemplos
   - Props: comentarios en interface
   - Funciones internas: comentarios

2. BankAccountManager.tsx (1h)
3. TransactionRow.tsx (0.5h)
4. TransactionsSummary.tsx (0.5h)
5. Other components (2h)

Total: 5h
```

**Formato estándar:**

```typescript
/**
 * Formulario de transacciones con auto-categorización
 *
 * Permite crear/editar transacciones con:
 * - Validación automática de montos
 * - Auto-detección de tipo y categoría
 * - Manejo de idempotencia
 *
 * @component
 * @example
 * <TransactionForm
 *   accounts={bankAccounts}
 *   onSuccess={() => refetch()}
 * />
 */
```

---

### 2.2 Agregar JSDoc a Server Actions 🎯

**Estimación:** 6 horas  
**Esfuerzo:** Bajo  
**ROI:** Medio (Onboarding)

**Trabajo - Por cada feature:**

- Función: descripción detallada
- Parámetros: comentarios
- Return: Result type
- Throws: Tipos de error

```typescript
/**
 * Crea una nueva transacción con auto-detección
 *
 * Valida montos y fechas, detecta automáticamente:
 * - Tipo (income, expense, transfer, etc.)
 * - Categoría (based on keywords)
 *
 * Garantiza idempotencia mediante idempotency_key.
 *
 * @param data - Datos del formulario
 * @param idempotencyKey - Para evitar duplicatas
 * @returns {Promise<Result<void, AppError>>}
 * @throws {ValidationError} Montos/fechas inválidos
 * @throws {DatabaseError} Fallo al guardar
 *
 * @example
 * const result = await createTransactionWithAutoDetection({
 *   amount: "100.50",
 *   date: "2026-02-18",
 *   description: "Almuerzo en restaurante"
 * });
 */
export async function createTransactionWithAutoDetection(
  data: TransactionFormData,
  idempotencyKey?: string
): Promise<Result<void, AppError>> {
```

---

## 🟡 PRIORIDAD 3 - MEDIA (Semana 2)

### 3.1 Consolidar CSS Duplicado 📦

**Estimación:** 6 horas  
**Esfuerzo:** Medio  
**ROI:** Alto (Bundle -50KB)

**Estrategia: Shared Utilities en src/components/ui/shared.module.css**

```css
/* src/components/ui/shared.module.css */
.container {
  padding: 24px 0;
  max-width: 1200px;
  margin: 0 auto;
}

.flexBetween {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flexCenter {
  display: flex;
  justify-content: center;
  align-items: center;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.buttonBase {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.buttonPrimary {
  composes: buttonBase;
  background-color: var(--primary-color, #3b82f6);
  color: white;
}
```

**Refactorizar:**

1. Revisar cada archivo CSS (9 archivos)
2. Copiar utilidades a shared.module.css
3. Reemplazar con @composes o imports
4. Ejecutar build para validar

**Checklist:**

- [ ] Crear shared.module.css
- [ ] Revisar 11 archivos CSS
- [ ] Extraer 50+ líneas duplicadas
- [ ] Refactorizar cada archivo
- [ ] Build exitoso
- [ ] Validar que se ve igual

---

### 3.2 Reorganizar Componentes Misplaced 📁

**Estimación:** 1 hora  
**Esfuerzo:** Muy bajo  
**ROI:** Medio (Claridad arquitectónica)

**Trabajo:**

```bash
# 1. Mover componentes transactions
mv src/components/transactions/* \
    src/features/transactions/components/
rmdir src/components/transactions/

# 2. Validar que no hay broken imports
npm run lint
npm run build

# 3. Actualizar imports en app/
# grep -r "from.*components/transactions" src/app/
# Reemplazar con: from "@/features/transactions/components"
```

**Checklist:**

- [ ] Mover componentes a su feature
- [ ] Actualizar imports
- [ ] npm run build - exitoso
- [ ] npm run lint - sin warnings

---

### 3.3 Detectar y Mover Código Muerto 🗑️

**Estimación:** 4 horas  
**Esfuerzo:** Bajo-Medio  
**ROI:** Medio (Limpieza)

**Trabajo:**

```bash
# 1. Instalar herramientas
npm install -D next-unused depcheck unimported

# 2. Ejecutar análisis
npx next-unused
npx depcheck
npx unimported

# 3. Revisar resultados
# Mover EJEMPLOS.tsx, ui-test/page.tsx a examples/

# 4. Crear ejemplos README
mkdir -p examples/components examples/pages
```

**Checklist:**

- [ ] Ejecutar detectores
- [ ] Documentar hallazgos
- [ ] Crear examples/ directory
- [ ] Mover archivos demo
- [ ] Actualizar .gitignore
- [ ] Build exitoso

---

### 3.4 Crear Documentation de Features 📚

**Estimación:** 4 horas  
**Esfuerzo:** Bajo  
**ROI:** Medio (Onboarding)

**Crear README.md en cada feature:**

```markdown
# Feature: Transactions

## Descripción

Manejo completo de transacciones financieras con auto-categorización.

## Componentes

- TransactionForm - Formulario de creación
- TransactionRow - Fila en tabla
- TransactionsSummary - Resumen de totales
- TransactionStatusBadge - Badge de estado

## Server Actions

- createTransactionWithAutoDetection
- updateBalancesAfterTransaction
- flagTransactionAsSuspicious

## Hooks

- useTransactionForm - Hook principal

## Ejemplos

[Ver tests en __tests__/]
```

**Ubicaciones:**

- src/features/transactions/README.md
- src/features/bank-accounts/README.md
- src/features/contacts/README.md
- src/features/digital-wallets/README.md

---

## 🟢 PRIORIDAD 4 - BAJA (Optional, Semana 3)

### 4.1 Reorganizar lib/ en Subcarpetas (Optional)

**Estimación:** 3 horas  
**ROI:** Bajo (Solo si >20 utils)

No hacer ahora, evaluar después.

---

### 4.2 Crear Tailwind Config (Optional)

**Por qué:** Facilitar utilidades CSS

**Estimación:** 4 horas  
**ROI:** Medio

No hacer ahora, evaluar en futuro.

---

## 📅 Timeline Recomendado

### DÍA 1-2 (Tests Server Actions + Utilities)

- 8h: Crear tests infrastructure
- 8h: Tests para server actions (2/4)
- 4h: Tests para utilities

### DÍA 3-4 (Tests Components)

- 8h: Tests para TransactionForm + BankAccountManager
- 8h: Tests para componentes adicionales

### DÍA 5 (Documentación)

- 4h: JSDoc en componentes
- 4h: JSDoc en server actions
- 2h: Create feature READMEs

### DÍA 6-7 (Arquitectura + Cleanup)

- 6h: Consolidar CSS
- 1h: Reorganizar componentes
- 4h: Detectar/mover código muerto
- 4h: Build/test/validación final

---

## ✅ Criterios de Éxito

### Semana 1

- [ ] 200+ tests nuevos implementados
- [ ] All tests passing
- [ ] npm run test:coverage >= 50%
- [ ] JSDoc en todos los componentes principales
- [ ] JSDoc en todas las server actions
- [ ] npm run build - exitoso sin warnings
- [ ] npm run lint - exitoso

### Semana 2

- [ ] CSS consolidado - bundle -50KB
- [ ] Componentes en ubicación correcta
- [ ] Código muerto removido
- [ ] Feature READMEs creados
- [ ] npm run test:coverage >= 80%
- [ ] Último npm run build - exitoso
- [ ] Último npm run test - todos pasan

---

## 📊 Métricas Finales Esperadas

| Métrica                     | Antes    | Después | Mejora |
| --------------------------- | -------- | ------- | ------ |
| Tests                       | 84       | 350+    | +300%  |
| Coverage                    | 7%       | 80%+    | +1000% |
| Bundle CSS                  | ~450KB   | ~400KB  | -50KB  |
| Componentes documentados    | 1%       | 100%    | +99%   |
| Server actions documentados | 0%       | 100%    | +100%  |
| Código muerto               | ≥3 files | 0       | ✅     |
| Build time                  | ?        | < 60s   | ?      |

---

## 🚀 Próximo: [10_TODO_ITEMS.md](./10_TODO_ITEMS.md)

Checklist detallado y actionable para ejecutar todo el plan.
