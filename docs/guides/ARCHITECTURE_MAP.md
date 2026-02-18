# 🗺️ Mapa de la Aplicación - Estructura Completa

```
finance-app_3.0/
├── 📄 Documentación Principal
│   ├── QUICKSTART.md ........................ Guía rápida de inicio
│   ├── SYSTEM_UPGRADE_GUIDE.md ............. Documentación de cambios
│   ├── ADVANCED_RECOMMENDATIONS.md ........ Próximas características
│   ├── IMPLEMENTATION_SUMMARY.md .......... Resumen de cambios
│   ├── EXAMPLES.ts ......................... Ejemplos de código
│   └── THIS FILE ........................... Mapa de aplicación
│
├── 🗄️ Base de Datos
│   ├── src/db/
│   │   ├── index.ts
│   │   └── schema/
│   │       ├── identity.ts ................. Tablas de autenticación (sin cambios)
│   │       ├── auth.ts ..................... Schema de NextAuth (sin cambios)
│   │       └── finance.ts .................. ⭐ UPDATED - MODIFICADO COMPLETAMENTE
│   │           ├── 📌 9 nuevos enums
│   │           ├── 📌 4 nuevas tablas
│   │           ├── 📌 1 tabla mejorada
│   │           ├── 📌 60+ nuevas columnas
│   │           └── 📌 Relaciones complejas
│   │
│   └── drizzle/
│       └── 0000_chilly_grim_reaper.sql ... Migración aplicada ✅
│
├── 🔧 Lógica de Negocio (Server Actions)
│   ├── src/core/actions/
│   │   ├── auth.ts ......................... Auth (sin cambios)
│   │   ├── transactions.ts ................ Transacciones originales
│   │   ├── bank-accounts.ts ............... ⭐ NUEVO - Gestión de cuentas
│   │   ├── digital-wallets.ts ............ ⭐ NUEVO - Gestión de wallets
│   │   ├── contacts.ts ................... ⭐ NUEVO - Gestión de contactos
│   │   └── enhanced-transactions.ts ...... ⭐ NUEVO - Transacciones mejoradas
│   │
│   └── src/lib/
│       ├── auth.ts
│       ├── auth.config.ts
│       └── transaction-detector.ts ........ ⭐ NUEVO - Motor de detección
│
├── 📱 Componentes (Frontend)
│   ├── src/components/
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── transactions/
│   │   ├── ui/
│   │   ├── BankAccountManager.tsx ........ ⭐ NUEVO - Componente completo
│   │   ├── BankAccountManager.module.css . ⭐ NUEVO - Estilos
│   │   └── Providers.tsx
│   │
│   └── src/app/
│       ├── page.tsx
│       ├── layout.tsx
│       ├── dashboard/
│       ├── transactions/
│       ├── settings/
│       ├── auth/
│       │   ├── login/
│       │   └── register/
│       └── api/
│
├── 📚 Tipos TypeScript
│   └── src/types/
│       ├── index.ts ........................ ⭐ ACTUALIZADO
│       ├── theme.ts
│       └── next-auth.d.ts
│
├── 🎨 Contextos y Constantes
│   ├── src/contexts/
│   ├── src/constants/
│   └── src/hooks/
│
└── ⚙️ Configuración
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── drizzle.config.ts
    ├── eslint.config.mjs
    └── .env.local (contiene DB_URL)
```

---

## 📍 Dónde Está Cada Cosa

### 🏦 Cuentas Bancarias

**Schema:**
```
src/db/schema/finance.ts
├── bankAccountTypeEnum
├── bankEnum
└── bankAccounts (tabla)
```

**Server Actions:**
```
src/core/actions/bank-accounts.ts
├── createBankAccount()
├── getBankAccounts()
├── updateBankAccount()
├── deleteBankAccount()
├── updateBankAccountBalance()
└── searchBankAccountByCBUOrAlias()
```

**Componente:**
```
src/components/
├── BankAccountManager.tsx
└── BankAccountManager.module.css
```

**Tipos:**
```
src/types/index.ts
├── BankAccount
├── BankAccountType
└── Bank
```

---

### 💳 Billeteras Digitales

**Schema:**
```
src/db/schema/finance.ts
├── walletProviderEnum
└── digitalWallets (tabla)
```

**Server Actions:**
```
src/core/actions/digital-wallets.ts
├── createDigitalWallet()
├── getDigitalWallets()
├── updateDigitalWallet()
├── deleteDigitalWallet()
└── updateWalletBalance()
```

**Tipos:**
```
src/types/index.ts
├── DigitalWallet
└── WalletProvider
```

---

### 👥 Contactos/Terceros

**Schema:**
```
src/db/schema/finance.ts
└── contacts (tabla)
```

**Server Actions:**
```
src/core/actions/contacts.ts
├── createContact()
├── getContacts()
├── searchContacts()
├── searchContactByCBUOrAlias()
├── updateContact()
└── deleteContact()
```

**Tipos:**
```
src/types/index.ts
└── Contact
```

---

### 💰 Transacciones Mejoradas

**Schema:**
```
src/db/schema/finance.ts
├── paymentMethodEnum
├── transactionReferenceTypeEnum
├── financial_transaction (mejorada)
└── transaction_metadata (nueva)
```

**Server Actions:**
```
src/core/actions/enhanced-transactions.ts
├── createTransactionWithAutoDetection()
├── updateBalancesAfterTransaction()
├── getTransactionsWithMetadata()
├── flagTransactionAsSuspicious()
└── getSuspiciousTransactions()
```

**Detección Inteligente:**
```
src/lib/transaction-detector.ts
├── detectTransactionType()
├── detectCategoryFromDescription()
└── detectSuspiciousActivity()
```

**Tipos:**
```
src/types/index.ts
├── Transaction
├── TransactionMetadata
├── TransactionType
├── TransactionCategory
├── PaymentMethod
└── Otros enums
```

---

## 🔄 Flujos de Datos

### Flujo 1: Crear una Cuenta Bancaria

```
Usuario
  ↓
Componente: BankAccountManager.tsx
  ├── Formulario (UI)
  └── onSubmit
      ↓
Action: createBankAccount()
  ├── Verificar autenticación
  ├── Validar datos
  ├── Insertar en DB
  └── Retornar resultado
      ↓
Component recibe respuesta
  ├── Actualizar estado
  ├── Revalidar caché
  └── Mostrar feedback
      ↓
BD: bank_account (tabla)
```

---

### Flujo 2: Crear una Transacción con Detección

```
Usuario
  ↓
Formulario (amount, description, etc.)
  ↓
Action: createTransactionWithAutoDetection()
  ├── Obtener cuentas del usuario
  ├── Llamar detectTransactionType()
  │   ├── Analizar fromBankAccountId
  │   ├── Analizar toBankAccountId
  │   └── Retornar tipo automático
  │
  ├── Llamar detectCategoryFromDescription()
  │   ├── Buscar palabras clave
  │   └── Retornar categoría
  │
  ├── Crear transacción en BD
  ├── Crear metadata
  ├── Actualizar saldos
  └── Revalidar UI
      ↓
BD: 3 tablas actualizadas
├── financial_transaction
├── transaction_metadata
├── bank_account (saldos)
└── digital_wallet (saldos)
```

---

### Flujo 3: Búsqueda de Contacto

```
Usuario ingresa: "juan.perez" o CBU
  ↓
Action: searchContactByCBUOrAlias()
  ├── Verificar autenticación
  ├── Buscar en BD
  │   └── WHERE cbu = ? OR alias = ?
  └── Retornar contacto
      ↓
Componente muestra resultado
```

---

## 🚀 Cómo Usar Cada Parte

### Para Trabajar con Cuentas Bancarias

```typescript
import { createBankAccount, getBankAccounts, updateBankAccount } from "@/core/actions/bank-accounts";

// 1. Crear
const result = await createBankAccount({
  accountName: "Mi Caja",
  bank: "bbva",
  // ... más datos
});

// 2. Obtener todas
const accounts = await getBankAccounts();

// 3. Actualizar
await updateBankAccount(id, { notes: "nueva nota" });
```

---

### Para Trabajar con Wallets

```typescript
import { createDigitalWallet, getDigitalWallets, updateWalletBalance } from "@/core/actions/digital-wallets";

// 1. Crear
const result = await createDigitalWallet({
  walletName: "Mi MP",
  provider: "mercado_pago",
  // ... más datos
});

// 2. Obtener todas
const wallets = await getDigitalWallets();

// 3. Actualizar saldo
await updateWalletBalance(id, "15000");
```

---

### Para Trabajar con Contactos

```typescript
import { createContact, searchContacts, searchContactByCBUOrAlias } from "@/core/actions/contacts";

// 1. Crear
const result = await createContact({
  name: "Carlos",
  cbu: "0720...",
  // ... más datos
});

// 2. Buscar por términos
const results = await searchContacts("carlos");

// 3. Buscar por CBU/Alias
const found = await searchContactByCBUOrAlias("juan.perez");
```

---

### Para Crear Transacciones Automáticas

```typescript
import { createTransactionWithAutoDetection } from "@/core/actions/enhanced-transactions";

// ¡SIN ESPECIFICAR TIPO NI CATEGORÍA!
const result = await createTransactionWithAutoDetection({
  amount: -250,
  description: "Restaurant Don Julio", // 👈 Se analiza aquí
  date: new Date(),
  fromBankAccountId: "xxx"
  // Sistema detecta automáticamente:
  // - type: "expense"
  // - category: "food"
});
```

---

## 📊 Vista de Bases de Datos

### Tablas Nuevas

```sql
-- Cuentas Bancarias (17 columnas)
bank_account
├── id (UUID, PK)
├── userId (FK → users)
├── accountName, bank, accountType
├── accountNumber, cbu, alias, iban
├── currency, balance
├── ownerName, ownerDocument
├── isActive, notes
└── createdAt, updatedAt

-- Billeteras (13 columnas)
digital_wallet
├── id, userId, walletName, provider
├── email, phoneNumber, username
├── currency, balance
├── linkedBankAccountId (FK)
├── isActive
└── createdAt, updatedAt

-- Contactos (13 columnas)
contact
├── id, userId, name
├── email, phoneNumber, document
├── cbu, alias, iban, bank
├── notes
└── createdAt, updatedAt

-- Metadata de Transacciones (17 columnas)
transaction_metadata
├── id
├── transactionId (FK)
├── referenceType, referenceNumber
├── merchantName, merchantCategory, merchantLocation
├── receiptUrl, invoiceNumber
├── tags, internalNotes
├── isReconciled, reconciliationDate
├── isFlagged, flagReason
└── createdAt, updatedAt
```

### Tabla Mejorada

```sql
-- financial_transaction (24 columnas ahora)
financial_transaction
├── Campos originales...
├── NUEVOS:
├── fromBankAccountId (FK)
├── toBankAccountId (FK)
├── fromWalletId (FK)
├── toWalletId (FK)
├── contactId (FK)
├── paymentMethod
├── isTransferBetweenOwnAccounts
├── isTransferToThirdParty
├── isCashWithdrawal
└── isCashDeposit
```

---

## 🧠 Motor de Detección Inteligente

```
transaction-detector.ts

detectTransactionType()
├── Si ambas cuentas son del usuario
│   └── return "transfer_own_accounts"
├── Si paymentMethod = "cash" y negativo
│   └── return "withdrawal"
├── Si paymentMethod = "cash" y positivo
│   └── return "deposit"
├── Si tiene una cuenta de origen
│   └── return "transfer_third_party"
├── Si es positivo sin cuenta origen
│   └── return "income"
└── Sino
    └── return "expense"

detectCategoryFromDescription()
├── "restaurant", "café" → "food"
├── "uber", "taxi" → "transportation"
├── "netflix", "spotify" → "entertainment"
├── "farmacia", "doctor" → "health"
└── ... 30+ más patrones

detectSuspiciousActivity()
├── Monto > 5x promedio
├── 10+ transacciones en 1 hora
└── Cambio radical en patrón
```

---

## 🎯 Instrucciones Rápidas

### Para Agregar un Banco Nuevo

1. **Actualizar enum en `finance.ts`:**
```typescript
export const bankEnum = pgEnum("bank", [
  // ... existentes
  "mi_nuevo_banco", // ← Agregar
]);
```

2. **Generar migración:**
```bash
npm run db:generate
npm run db:push
```

---

### Para Agregar una Nueva Wallet

1. **Actualizar enum en `finance.ts`:**
```typescript
export const walletProviderEnum = pgEnum("wallet_provider", [
  // ... existentes
  "mi_nuevo_wallet", // ← Agregar
]);
```

2. **Generar migración:**
```bash
npm run db:generate
npm run db:push
```

---

### Para Agregar una Nueva Categoría

1. **Actualizar enum en `finance.ts`:**
```typescript
export const transactionCategoryEnum = pgEnum("transaction_category", [
  // ... existentes
  "mi_categoria", // ← Agregar
]);
```

2. **Actualizar keywords en `transaction-detector.ts`:**
```typescript
if (lowerDesc.includes("palabra_clave")) {
  return "mi_categoria";
}
```

3. **Actualizar tipo en `types/index.ts`:**
```typescript
export type TransactionCategory = 
  | "mi_categoria" // ← Agregar
  | "other";
```

---

## 📈 Próximas Páginas a Crear

```
src/app/
├── accounts/
│   ├── page.tsx ...................... Listado de cuentas
│   └── [id]/
│       └── page.tsx .................. Detalle de cuenta
│
├── wallets/
│   ├── page.tsx ...................... Listado de wallets
│   └── [id]/edit/page.tsx ............ Editar wallet
│
├── contacts/
│   ├── page.tsx ...................... Directorio
│   ├── [id]/page.tsx ................. Detalle
│   └── new/page.tsx .................. Crear nuevo
│
├── transactions/
│   ├── page.tsx ...................... Listado (YA EXISTE)
│   └── advanced/page.tsx ............ Búsqueda avanzada
│
└── dashboard/
    ├── page.tsx (YA EXISTE)
    └── reports/page.tsx ............ Reportes
```

---

## 🔍 Búsqueda Rápida

| Necesito... | Voy a... |
|-------------|----------|
| Crear una cuenta bancaria | `bank-accounts.ts` → `createBankAccount()` |
| Listar mis cuentas | `bank-accounts.ts` → `getBankAccounts()` |
| Escribir el schema | `db/schema/finance.ts` |
| Crear transacción inteligente | `enhanced-transactions.ts` → `createTransactionWithAutoDetection()` |
| Entender detección | `lib/transaction-detector.ts` |
| Ver tipos | `types/index.ts` |
| Usar componente | `components/BankAccountManager.tsx` |
| Aprender rápido | `QUICKSTART.md` |
| Ver ejemplos | `EXAMPLES.ts` |

---

**🗺️ Mapa completo de la arquitectura**

Última actualización: Febrero 13, 2026
