# 3️⃣ Análisis de Imports y Dependencias

**Fecha:** 18 Febrero 2026

---

## 📊 Resumen

Revisión de la estructura de imports y gestión de dependencias del proyecto.

**Status confirmado:**

- ✅ ESLint configurado con reglas de import
- ✅ simple-import-sort y eslint-plugin-import instalados
- ✅ Aliases de paths configurados (@ -> src/)
- ⚠️ Necesita validación de imports reales en archivos

---

## ✅ Lo que está BIEN

### 1. Configuración de ESLint ✅

**Archivo:** `eslint.config.mjs`

```javascript
{
  plugins: {
    "simple-import-sort": simpleImportSort,
    import: importPlugin,
  },
  rules: {
    "simple-import-sort/imports": "error",      ✅
    "simple-import-sort/exports": "error",      ✅
    "import/first": "error",                    ✅
    "import/newline-after-import": "error",     ✅
    "import/no-duplicates": "error",            ✅
    "no-console": ["error", { allow: [] }],     ✅
  },
}
```

**Características:**

- ✅ Ordena imports automáticamente
- ✅ Detecta imports duplicados
- ✅ Fuerza line break después de imports
- ✅ Prohibe console.log (force logger)

---

### 2. Path Aliases Configurados ✅

**Archivo:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Beneficios:**

- ✅ Imports limpios: `from '@/lib/result'` vs `from '../../../../lib/result'`
- ✅ Fácil refactorizar rutas
- ✅ Mejor legibilidad

---

### 3. Package.json bien estructurado ✅

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "drizzle-orm": "^0.45.1",
    "next-auth": "^5.0.0-beta.30",
    "bcryptjs": "^3.0.3",
    "ws": "^8.19.0"
  },
  "devDependencies": {
    // Testing
    "vitest": "^4.0.18",
    "@testing-library/react": "^16.3.2",
    // Linting
    "eslint": "^9",
    "eslint-plugin-import": "^2.32.0",
    "eslint-plugin-simple-import-sort": "^12.1.1",
    // Build tools
    "drizzle-kit": "^0.31.9",
    "tsx": "^4.21.0"
  }
}
```

**Observación:** Dependencias bien separadas (deps vs devDeps)

---

## ⚠️ Issues Detectados

### 1. Posibles Imports No Usados ⚠️

**Problema:**
Sin ejecutar `npm run lint`, hay indicios de imports potencialmente no usados:

**Ejemplo en TransactionForm.tsx:**

```tsx
import Button from "@/components/ui/Buttons/Button";
// ¿Se usa Button realmente? Necesita verificación
```

**Solución:**

```bash
# Ejecutar análisis
npm run lint --rule 'import/no-unused-modules: warn'

# O con herramienta especializada
npx unimported
```

---

### 2. Estructura de Imports en Componentes ⚠️

**Patrón observado en TransactionForm.tsx:**

```tsx
// ❌ Orden inconsistente potencial
import { memo, useEffect, useRef, useTransition } from "react";
import { createTransactionWithAutoDetection } from "@/features/transitions/actions";
import Button from "@/components/ui/Buttons/Button";
import { useMessage } from "@/hooks/useMessage";
import { getCategorySelectOptions } from "@/constants/transactionLabels";
import { eventBus, EVENTS } from "@/lib/eventBus";
import { useTransactionForm } from "../hooks/useTransactionForm";
import type { AppError } from "@/lib/result";
import styles from "./TransactionForm.module.css";
```

**Esperado (según eslint-plugin-simple-import-sort):**

```tsx
// ✅ Orden correcto
import { memo, useEffect, useRef, useTransition } from "react";

import Button from "@/components/ui/Buttons/Button";
import type { AppError } from "@/lib/result";
import { useMessage } from "@/hooks/useMessage";
import { eventBus, EVENTS } from "@/lib/eventBus";
import { getCategorySelectOptions } from "@/constants/transactionLabels";
import { createTransactionWithAutoDetection } from "@/features/transactions/actions";

import { useTransactionForm } from "../hooks/useTransactionForm";
import styles from "./TransactionForm.module.css";
```

**Orden esperado:**

1. Imports de librerías externas (react, next-auth, etc.)
2. Imports de @/ (alias)
3. Imports relativos (./ ../)
4. Imports de tipos (type { ... })
5. Imports CSS

---

### 3. Dependencias Circulares Potenciales ⚠️

**Áreas sospechosas:**

```
src/features/*/components/
  ↓ import
src/features/*/actions/
  ↓ import (circular?)
src/features/*/hooks/
```

**Verificación necesaria:**

```bash
# Detectar imports circulares
npm run lint -- --rule 'import/no-cycle: error'
```

---

### 4. Imports de Rutas Innecesarias ⚠️

**Problema sospechado:**

```tsx
// ❌ Potencial problema
import { useTransactionForm } from "../hooks/useTransactionForm";

// ✅ Debería ser (si existe barrel export)
import { useTransactionForm } from "../hooks";
```

**Verificación:**

- [ ] Revisar si existen `index.ts` en todas las carpetas
- [ ] Validar que los barrel exports están completos

**Ejemplos found:**

```
src/features/transactions/hooks/index.ts      ✅ Existe
src/features/bank-accounts/components/index.ts ✅ Existe
```

---

### 5. Imports de Constantes Sin Sincronización ⚠️

**Problema:**
Constantes definidas en múltiples lugares sin sincronización automática:

```typescript
// src/db/schema/finance.ts
export const transactionTypeEnum = pgEnum('transaction_type', [
  'income', 'expense', 'transfer_own_accounts', ...
])

// src/constants/transactionTypes.ts (duplicado manual)
export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Gasto' },
  // ... hay que mantener sincronizado
]
```

**Solución Ideal:**

```typescript
// src/constants/transactionTypes.ts
import { transactionTypeEnum } from "@/db/schema/finance";

// Auto-generar desde el enum
export const TRANSACTION_TYPES = transactionTypeEnum.enumValues.map((val) => ({
  value: val,
  label: LABELS[val],
}));

const LABELS: Record<string, string> = {
  income: "Ingreso",
  expense: "Gasto",
  // ...
};
```

---

### 6. Imports TypeScript vs Runtime ⚠️

**Buen patrón observado:**

```tsx
// ✅ Correcto - separar imports de tipos
import type { AppError } from "@/lib/result";

// ✅ Correcto - imports de valores
import { ok, err } from "@/lib/result";
```

**Verificación necesaria:**

- [ ] Auditar todos los archivos para separar `import` vs `import type`
- [ ] Ejecutar ESLint para validar

---

## 📋 Herramientas Recomendadas

### 1. Para detectar imports sin usar

```bash
npm install -D unimported
```

**Uso:**

```bash
npx unimported
```

---

### 2. Para validar ciclos de imports

```bash
npm run lint -- --rule 'import/no-cycle: error'
```

---

### 3. Para verificar todas las dependencias

```bash
npm install -D depcheck
```

**Uso:**

```bash
npx depcheck
```

---

## 🎯 Checklist de Validación de Imports

- [ ] Ejecutar `npm run lint` sin warnings
- [ ] Ejecutar `npx unimported` y revisar resultados
- [ ] Ejecutar `npx depcheck` para deps no usadas
- [ ] Validar que no hay imports circulares
- [ ] Auditar archivos para separar `import` vs `import type`
- [ ] Verificar batch de exports en index.ts files
- [ ] Validar rutas relativas vs alias (@/)

---

## 🔍 Análisis Profundo Necesario

### Archivo a revisar: src/proxy.ts

**Problema detectado en documentación:**

- Archivo sin claro con propósito
- Posiblemente import sin usar
- Necesita análisis

### Archivos: src/lib/auth.config.ts y src/lib/auth.ts

**Problema detectado:**

- Posible confusión entre dos archivos de auth
- Claridad de responsabilidades

---

## 📊 Resultados de Análisis

| Aspecto                | Status    | Notas                    |
| ---------------------- | --------- | ------------------------ |
| ESLint config          | ✅ Good   | Reglas bien configuradas |
| Path aliases           | ✅ Good   | @ -> src/ funciona       |
| Separación import/type | ✅ Mostly | Necesita validación      |
| Imports duplicados     | ? Unknown | Ejecutar ESLint          |
| Imports circulares     | ? Unknown | Ejecutar ESLint          |
| Imports sin usar       | ? Unknown | Ejecutar unimported      |

---

## 🚀 Próximas Acciones

1. **Ejecutar validación completa:**

   ```bash
   npm run lint
   npx unimported
   npx depcheck
   ```

2. **Reparar issues encontrados:**
   - Auto-fix con: `npm run lint --fix`
   - Maneuales si aplica

3. **Documenta hallazgos** en [RESULTADOS_IMPORTS.md](./RESULTADOS_IMPORTS.md)

---

## 🔗 Siguiente: [04_COMPONENTES_UI.md](./04_COMPONENTES_UI.md)
