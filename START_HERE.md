# 🚀 INICIO RÁPIDO - COMIENZA EN 10 MINUTOS

> **El sistema está 100% funcional y listo para usar AHORA**

---

## 0️⃣ Estado Actual

✅ **Base de datos** - Migrada y lista en Neon PostgreSQL  
✅ **Server Actions** - 25 funciones listas para usar  
✅ **Componentes** - BankAccountManager preparado  
✅ **Tipos** - TypeScript 100% tipado  
✅ **Documentación** - 7 archivos detallados

**Tu app está lista. Vamos a empezar.**

---

## 1️⃣ LO PRIMERO: Ver Tu Dashboard

Abre `src/app/dashboard/page.tsx`:

```tsx
import { BankAccountManager } from "@/components";

export default function DashboardPage() {
  return (
    <div>
      <h1>Mi Dashboard</h1>

      {/* 👇 AGREGAR ESTA LÍNEA 👇 */}
      <BankAccountManager />

      {/* resto de componentes */}
    </div>
  );
}
```

**¿Qué hace?** Te muestra todas tus cuentas bancarias y te deja crear nuevas.

---

## 2️⃣ Crear Tu Primera Cuenta Bancaria

En tu app (cuando usuario está logueado):

```tsx
// El componente BankAccountManager:
// 1. Abre un formulario
// 2. Completas: Banco, Tipo, CBUUU, Alias, Saldo
// 3. Click "Crear"
// 4. ¡LISTO! Se guarda en BD

// Detrás hace:
// - Validación de datos
// - Encriptación de datos sensibles (CBUUU)
// - Guardado en PostgreSQL
// - Actualización de UI
```

**Campos del Formulario:**

- Banco (dropdown: 20 bancos)
- Tipo de Cuenta (dropdown: 6 opciones)
- Número de Cuenta
- CBUUU
- Alias (ej: "Mi cuenta de ahorros")
- Moneda (ARS/USD/EUR)
- Saldo Inicial
- Titular
- Documento

---

## 3️⃣ Crear Una Transacción CON AUTO-DETECCIÓN

El código más importante:

```typescript
// En src/core/actions/enhanced-transactions.ts
import { createTransactionWithAutoDetection } from "@/core/actions/enhanced-transactions";

// Usar así:
const myTransaction = await createTransactionWithAutoDetection({
  amount: -250, // ARS 250 hacia afuera
  description: "Restaurant Moretti", // 👈 MÁS IMPORTANTE
  fromAccountId: "cuenta-1",
  toAccountId: undefined, // Si no pones toAccountId, detecta que es a terceros
  paymentMethod: "debit_card",
  referenceNumber: "TXN-123",
});

// 🪄 EL SISTEMA AUTOMÁTICAMENTE:
// ✅ Detecta que es: GASTO (tipo: expense)
// ✅ Categoriza como: COMIDA (category: food)
// ✅ Sabe que fue: A UN TERCERO (payment)
// ✅ Actualiza saldos
// ✅ Guarda metadata
```

**¿Cómo decide qué categoría?**

Busca palabras clave en la descripción:

- "Restaurant" / "Café" / "Pizza" → **Comida**
- "Uber" / "Taxi" / "Estación" → **Transporte**
- "Netflix" / "Spotify" → **Entretenimiento**
- "Farmacia" / "Doctor" → **Salud**
- ¡Y 20+ más!

**¿Cómo decide qué tipo?**

1. ¿Cuenta de origen = Cuenta de destino? → **Transferencia propia**
2. ¿Hay toAccountId? → **Transferencia a tercero**
3. ¿paymentMethod es cash_withdrawal? → **Retiro de efectivo**
4. ¿Monto positivo? → **Ingreso**
5. **Si no → Gasto**

---

## 4️⃣ Ver Transacciones CON METADATA

```typescript
import { getTransactionsWithMetadata } from "@/core/actions/enhanced-transactions";

const transactions = await getTransactionsWithMetadata(userId);

transactions.forEach((tx) => {
  console.log({
    original: {
      id: tx.id,
      amount: tx.amount,
      description: tx.description,
    },
    detección: {
      type: tx.type, // "expense"
      category: tx.category, // "food"
      detectedAutomatically: tx.detectedAutomatically, // true
      confidence: tx.detectionConfidence, // 0.95
    },
    seguridad: {
      flaggedAsSuspicious: tx.flaggedAsSuspicious,
      suspiciousReason: tx.suspiciousReason,
    },
  });
});
```

---

## 5️⃣ Crear Contactos (Para Transferencias)

```typescript
import { createContact } from "@/core/actions/contacts";

const john = await createContact({
  userId: user.id,
  name: "Juan García",
  email: "juan@example.com",
  cbu: "0123456789012345678901",
  alias: "juan.garcia",
  bankName: "Banco Provincia",
  accountType: "checking",
  notes: "Amigo de la facu",
});

// Ahora puedes hacer transferencias a Juan:
await createTransactionWithAutoDetection({
  amount: -1000,
  description: "Dinero a Juan",
  fromAccountId: "mi-cuenta",
  toContactId: john.id, // 👈 LINK A CONTACTO
  type: "transfer_third_party",
});
```

---

## 6️⃣ Crear una Billetera Digital

```typescript
import { createDigitalWallet } from "@/core/actions/digital-wallets";

const mp = await createDigitalWallet({
  userId: user.id,
  provider: "mercado_pago", // o paypal, ualá, etc
  accountName: "Mi Mercado Pago",
  accountNumber: "user@gmail.com",
  balance: 5000,
  linkedBankAccountId: "mi-cuenta-principal", // opcional
  currency: "ARS",
});

// Ahora puedes hacer:
await createTransactionWithAutoDetection({
  amount: -500,
  description: "Giro a Mercado Pago",
  fromAccountId: "mi-cuenta",
  toWalletId: mp.id,
  type: "transfer_wallet",
});
```

---

## 7️⃣ Detectar Actividad Sospechosa

```typescript
import { flagTransactionAsSuspicious } from "@/core/actions/enhanced-transactions";

// El sistema AUTOMÁTICAMENTE marca como sospechosa:
// - Transacción de $50,000 (si tu promedio es $1,000)
// - 15 transacciones en 1 hora
// - Patrón diferente al normal

// Pero tú también puedes marcar:
await flagTransactionAsSuspicious(transactionId, {
  reason: "No reconozco este gasto",
  severity: "high",
});

// Después consultar:
const suspicious = await getSuspiciousTransactions(userId);
suspicious.forEach((tx) => {
  console.log(`⚠️ ${tx.description} - Razón: ${tx.suspiciousReason}`);
});
```

---

## 8️⃣ Actualizar Saldos (Manual o Automático)

```typescript
// OPCIÓN A: Automático (recomendado)
// createTransactionWithAutoDetection hace esto solo

// OPCIÓN B: Manual
import { updateBankAccountBalance } from "@/core/actions/bank-accounts";

await updateBankAccountBalance(accountId, {
  balanceChange: -500, // Restar 500
  reason: "Retiro cajero automático",
});

// Nueva versión = balance anterior + balanceChange
```

---

## 9️⃣ ESTRUCTURA IMPORTANTE A SABER

```
📁 src/
  📁 core/actions/
    ├─ bank-accounts.ts      ← CRUD de cuentas
    ├─ digital-wallets.ts    ← CRUD de wallets
    ├─ contacts.ts           ← CRUD de contactos
    └─ enhanced-transactions.ts  ← Operaciones inteligentes

  📁 lib/
    └─ transaction-detector.ts  ← 🪄 MAGIA (detección)

  📁 components/
    ├─ BankAccountManager.tsx  ← UI LISTA
    └─ BankAccountManager.module.css  ← Estilos

  📁 db/schema/
    └─ finance.ts  ← BD (9 enums, 5 tablas)

  📁 types/
    └─ index.ts  ← TypeScript types
```

---

## 🔟 TABLAS EN LA BD (Lo que necesitas saber)

```
📊 bank_account
  ├─ id (PK)
  ├─ userId (FK)
  ├─ bankEnum (which Bank)
  ├─ accountType (checking, saving, etc)
  ├─ accountNumber
  ├─ cbu / alias / iban
  ├─ currentBalance
  ├─ currency

📊 digital_wallet
  ├─ id (PK)
  ├─ userId (FK)
  ├─ provider (MP, PayPal, etc)
  ├─ accountNumber / email
  ├─ balance

📊 contact
  ├─ id (PK)
  ├─ userId (FK)
  ├─ name
  ├─ cbu / alias
  ├─ email

📊 financial_transaction
  ├─ id (PK)
  ├─ userId (FK)
  ├─ type (expense, income, transfer, etc)
  ├─ category (food, transport, etc)
  ├─ amount, description
  ├─ detectedAutomatically ← KEY!
  ├─ flaggedAsSuspicious
  ├─ fromAccountId (FK)
  ├─ toAccountId (FK)
  ├─ toContactId (FK)
  ├─ toWalletId (FK)

📊 transaction_metadata
  ├─ transactionId (FK)
  ├─ originalAmount
  ├─ exchangeRate
  ├─ detectionConfidence
  ├─ keywords (detectadas)
```

---

## ✅ CHECKLIST: LOS PRIMEROS PASOS

```
[ ] 1. Leer este archivo (5 min)
[ ] 2. Abrir BankAccountManager.tsx (2 min)
[ ] 3. Pegar el componente en dashboard (1 min)
[ ] 4. Crear una cuenta bancaria en UI (2 min)
[ ] 5. Entender la detección automática (5 min)
[ ] 6. Crear una transacción (2 min)
[ ] 7. Ver categorización automática (1 min)

⏱️ TOTAL: 18 minutos para estar operativo
```

---

## 🎯 METAS PROGRESIVAS

### 🟢 Fase 1: Entender

**Lo que necesitas saber AHORA:**

- El sistema crea cuentas ✅
- Categoriza transacciones automáticamente ✅
- Actualiza saldos solo ✅

**Tiempo:** 20 minutos

### 🟡 Fase 2: Usar

**Lo que necesitas hacer:**

- Agregar BankAccountManager a dashboard
- Crear 2-3 cuentas de prueba
- Crear 5-10 transacciones
- Ver categorización en acción

**Tiempo:** 30 minutos

### 🔴 Fase 3: Expandir

**Próximas features a agregar:**

- Dashboard con gráficos
- Presupuestos mensuales
- Alertas inteligentes
- Comparar con extractos bancarios

**Tiempo:** 2-3 semanas (opcional)

---

## 🪄 LA FÓRMULA MÁGICA (Cómo funciona todo)

```
Usuario escribe transacción:
  amount: -250
  description: "Restaurant"

          ↓ (entra a detector.ts)

Sistema analiza:
  1. ¿Quién recibe? → No hay toAccountId → Es a tercero
  2. ¿Qué es? → Descripción contiene "Restaurant" → Busca en patterns
  3. ¿Cuál categoría? → "Restaurant" match con /food/ → es FOOD
  4. ¿Cuánto es? → $250 vs promedio $800 → NORMAL (no sospechoso)

          ↓ (regresa al transaction creador)

SE GUARDA:
  ✅ type: "expense"
  ✅ category: "food"
  ✅ detectedAutomatically: true
  ✅ detectionConfidence: 0.95
  ✅ flaggedAsSuspicious: false
  ✅ cuenta origen: -250

          ↓ (listo en BD)

Usuario ve:
  "Restaurant" → COMIDA → -$250 → AUTOMÁTICO ✅
```

---

## ⚡ COMMANDOS CLAVE PARA COPIAR-PEGAR

### Crear Cuenta Bancaria (En componente)

```tsx
<BankAccountManager /> // ¡Eso es todo!
```

### Crear Transacción (En server action)

```typescript
const tx = await createTransactionWithAutoDetection({
  amount: -500,
  description: "Tu descripción aquí",
  fromAccountId: "id-de-tu-cuenta",
});
console.log(tx.type, tx.category); // "expense", "food"
```

### Listar Transacciones

```typescript
const txs = await getTransactionsWithMetadata(userId);
```

### Crear Contacto

```typescript
const contact = await createContact({
  userId,
  name: "Juan",
  cbu: "xxx",
  email: "juan@mail.com",
});
```

### Crear Wallet

```typescript
const wallet = await createDigitalWallet({
  userId,
  provider: "mercado_pago",
  accountNumber: "user@gmail.com",
  balance: 1000,
});
```

---

## 📍 PRÓXIMO PASO

### Opción A: Quiero Ver Todo Funcionando (RECOMENDADO)

1. Abre `src/app/dashboard/page.tsx`
2. Importa y agrega `<BankAccountManager />`
3. Presiona F5 o guarda (Next.js recompila)
4. Looks en tu dashboard
5. Crea una cuenta de prueba
6. ¡LISTO! Ya funciona

### Opción B: Quiero Entender Primero

1. Lee `QUICKSTART.md`
2. Lee `SYSTEM_UPGRADE_GUIDE.md`
3. Abre `EXAMPLES.ts`
4. Recién ahí implementa

### Opción C: Quiero El Código Completo

1. Abre `src/core/actions/`
2. Lee cada archivo
3. Entiende cómo funcionan
4. Luego integra donde necesites

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

| Problema                     | Solución                                        |
| ---------------------------- | ----------------------------------------------- |
| "usuario no logueado"        | Asegúrate de tener sesión activa                |
| "ID de cuenta inválida"      | Copia el ID correcto de tu BD                   |
| "Monto debe ser > 0"         | Usa -250 para gastos, 250 para ingresos         |
| "Campo requerido"            | Rellena todos los campos del form               |
| Transacción no se categoriza | Agrega palabras clave a transaction-detector.ts |
| Saldo no actualiza           | La transacción debe tener fromAccountId         |

---

## 🎁 BONUS: Tips Pro

**Tip 1:** Usa alias como "$spotify" para encontrar fácil
**Tip 2:** Agrega mucho detalle en descripción para mejor categorización
**Tip 3:** Crea contactos para transferencias frecuentes
**Tip 4:** Marca transacciones sospechosas para entrenar el sistema
**Tip 5:** Revisa `ADVANCED_RECOMMENDATIONS.md` para ideas de features

---

```
╔═══════════════════════════════════════╗
║                                       ║
║  🚀 ¡ESTÁS LISTO PARA EMPEZAR!      ║
║                                       ║
║  1. Abre dashboard/page.tsx          ║
║  2. Agrega <BankAccountManager />    ║
║  3. ¡Funciona!                        ║
║                                       ║
║  Tiempo total: 5 minutos             ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

## 📞 ¿Preguntas?

| Necesito...          | Lee...                              |
| -------------------- | ----------------------------------- |
| Ejemplos de código   | EXAMPLES.ts                         |
| Entender detección   | SYSTEM_UPGRADE_GUIDE.md → Detección |
| Ver arquitectura     | ARCHITECTURE_MAP.md                 |
| RFC técnica completa | IMPLEMENTATION_SUMMARY.md           |
| Guía de lectura      | README_DOCS.md                      |
| Próximas features    | ADVANCED_RECOMMENDATIONS.md         |
| ¿Qué se completó?    | COMPLETION_CHECKLIST.md             |

---

**Created:** 2024  
**Status:** ✅ 100% Operativo  
**Ready:** Ahorita  
**Next:** Tu turno 🎯
