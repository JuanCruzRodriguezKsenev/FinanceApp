# 🚀 Guía de Uso - Sistema de Gestión de Cuentas y Transacciones

## 📌 Resumen de Cambios

Se implementó un sistema **completo y radical** de gestión de transacciones inteligentes que incluye:

✅ Cuentas bancarias reales (CBU, alias, IBAN)  
✅ Billeteras digitales (Mercado Pago, PayPal, etc.)  
✅ Gestión de contactos/terceros  
✅ Detección automática de tipo de transacción  
✅ Categorización inteligente  
✅ Metadata y análisis de transacciones  
✅ Alertas de actividad sospechosa  

---

## 🗄️ Base de Datos

### Nuevas Tablas Creadas:

```sql
-- Cuentas bancarias reales
bank_account (17 columnas)

-- Billeteras digitales
digital_wallet (13 columnas)

-- Contactos/terceros
contact (13 columnas)

-- Metadata de transacciones
transaction_metadata (17 columnas)

-- Transacciones mejoradas
financial_transaction (24 columnas)
```

### Migraciones Ejecutadas:
✅ `db:generate` - Generó archivo de migración  
✅ `db:push` - Aplicó cambios a la BD  

---

## 📁 Archivos Nuevos Creados

### 1. **Server Actions**

#### `src/core/actions/bank-accounts.ts`
Gestión completa de cuentas bancarias:
```typescript
createBankAccount()        // Crear cuenta
getBankAccounts()          // Listar todas
updateBankAccount()        // Actualizar
deleteBankAccount()        // Eliminar
updateBankAccountBalance() // Actualizar saldo
searchBankAccountByCBUOrAlias() // Buscar
```

#### `src/core/actions/digital-wallets.ts`
Gestión de billeteras digitales:
```typescript
createDigitalWallet()      // Crear wallet
getDigitalWallets()        // Listar todas
updateDigitalWallet()      // Actualizar
deleteDigitalWallet()      // Eliminar
updateWalletBalance()      // Actualizar saldo
```

#### `src/core/actions/contacts.ts`
Gestión de contactos:
```typescript
createContact()            // Crear contacto
getContacts()              // Listar todos
searchContacts()           // Buscar por nombre
searchContactByCBUOrAlias() // Buscar por CBU/alias
updateContact()            // Actualizar
deleteContact()            // Eliminar
```

#### `src/core/actions/enhanced-transactions.ts`
Transacciones mejoradas:
```typescript
createTransactionWithAutoDetection() // Con detección automática
updateBalancesAfterTransaction()     // Actualizar saldos
getTransactionsWithMetadata()        // Con metadata
flagTransactionAsSuspicious()        // Marcar sospechosa
getSuspiciousTransactions()          // Listar sospechosas
```

### 2. **Utilidades**

#### `src/lib/transaction-detector.ts`
Motor de detección inteligente:
```typescript
detectTransactionType()        // Tipo automático
detectCategoryFromDescription() // Categoría automática
detectSuspiciousActivity()     // Anomalías
```

### 3. **Componentes**

#### `src/components/BankAccountManager.tsx`
Componente completo con:
- ✅ Formulario para agregar cuentas
- ✅ Listado de cuentas
- ✅ Edición de cuentas
- ✅ Eliminación segura
- ✅ Estilos responsivos

### 4. **Tipos**

Actualizados en `src/types/index.ts`:
```typescript
BankAccount          // Cuentas bancarias
DigitalWallet        // Billeteras
Contact              // Contactos
Transaction          // Transacciones mejoradas
TransactionMetadata  // Metadata
PaymentMethod        // Nuevos métodos de pago
Bank                 // Enums de bancos
WalletProvider       // Enums de wallets
```

---

## 🎯 Cómo Usar

### 1. Agregar una Cuenta Bancaria

```typescript
import { createBankAccount } from "@/core/actions/bank-accounts";

const result = await createBankAccount({
  accountName: "Mi Caja de Ahorro",
  bank: "bbva",
  accountType: "savings",
  accountNumber: "1234567890",
  cbu: "0720123456789012345678",
  alias: "pepe.rodriguez",
  currency: "ARS",
  balance: "50000",
  ownerName: "Juan Pérez",
  ownerDocument: "12345678"
});
```

### 2. Agregar una Billetera Digital

```typescript
import { createDigitalWallet } from "@/core/actions/digital-wallets";

const result = await createDigitalWallet({
  walletName: "Mi Mercado Pago",
  provider: "mercado_pago",
  email: "juan@example.com",
  currency: "ARS",
  balance: "5000",
  linkedBankAccountId: "account-id-here" // Opcional
});
```

### 3. Agregar un Contacto

```typescript
import { createContact } from "@/core/actions/contacts";

const result = await createContact({
  name: "Carlos García",
  email: "carlos@example.com",
  document: "87654321",
  cbu: "0720987654321098765432",
  alias: "carlos.garcia",
  bank: "santander"
});
```

### 4. Crear una Transacción con Detección Automática

```typescript
import { createTransactionWithAutoDetection } from "@/core/actions/enhanced-transactions";

// El sistema automáticamente detecta:
// - Si es entre tus propias cuentas
// - Si es a un tercero
// - Si es retiro/ingreso de efectivo
// - La categoría basada en la descripción

const result = await createTransactionWithAutoDetection({
  amount: -500,
  description: "Almuerzo en Restaurant Milanesa",
  date: new Date(),
  paymentMethod: "debit_card",
  fromBankAccountId: "account-id", // Opcional
  category: "food" // Se detecta automáticamente si no se proporciona
});
```

### 5. Buscar Contacto por CBU/Alias

```typescript
import { searchContactByCBUOrAlias } from "@/core/actions/contacts";

const result = await searchContactByCBUOrAlias("pepe.rodriguez");
// O por CBU:
const result = await searchContactByCBUOrAlias("0720123456789012345678");

if (result.success) {
  console.log(result.data); // Contacto encontrado
}
```

---

## 🧠 Detección Automática

### Tipo de Transacción
El sistema detecta automáticamente:

```
✅ transfer_own_accounts  → Si es entre tus cuentas
✅ transfer_third_party   → Si es a un tercero
✅ withdrawal            → Si es retiro de efectivo (ATM)
✅ deposit              → Si es ingreso de efectivo
✅ income               → Si es un ingreso
✅ expense              → Si es un gasto
```

### Categoría
El sistema analiza palabras clave en la descripción:

```
restaurant, café, pizza → "food"
uber, taxi, colectivo  → "transportation"
netflix, spotify, steam → "entertainment"
farmacia, doctor       → "health"
amazon, mercadolibre   → "shopping"
internet, electricidad → "utilities"
... y muchas más
```

### Flags de Anomalía
Detecta automáticamente:
```
⚠️ Montos anormalmente altos
⚠️ Múltiples transacciones rápidas
⚠️ Cambios en patrones
⚠️ Actividad sospechosa
```

---

## 📱 Componente de UI

### Usar BankAccountManager

```typescript
import { BankAccountManager } from "@/components/BankAccountManager";

export default function Page() {
  return (
    <div>
      <h1>Mis Finanzas</h1>
      <BankAccountManager />
    </div>
  );
}
```

El componente incluye:
- ✅ Formulario completo de creación
- ✅ Listado con tarjetas bonitas
- ✅ Eliminar cuentas
- ✅ Validaciones
- ✅ Responsive design
- ✅ Estados de carga

---

## 🔄 Flujo de una Transacción

```
1. Usuario crea transacción
   ↓
2. Sistema detecta automáticamente:
   - Tipo de transacción
   - Categoría
   - Si es sospechosa
   ↓
3. Se crea registro en BD con flags
   ↓
4. Se actualiza metadata
   ↓
5. Se actualizan saldos:
   - Cuenta bancaria origen/destino
   - Billetera origen/destino
   ↓
6. Se revalida UI automáticamente
```

---

## 📊 Estructura de Datos

### BankAccount
```typescript
{
  id: string;
  userId: string;
  accountName: string;        // "Mi Caja de Ahorro"
  bank: Bank;                 // "bbva", "santander", etc.
  accountType: BankAccountType; // "savings", "checking"
  accountNumber: string;
  cbu?: string;
  alias?: string;
  iban?: string;
  currency: string;           // "ARS", "USD"
  balance: string;
  ownerName: string;
  ownerDocument?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### DigitalWallet
```typescript
{
  id: string;
  userId: string;
  walletName: string;
  provider: WalletProvider;   // "mercado_pago", "paypal", etc.
  email?: string;
  phoneNumber?: string;
  currency: string;
  balance: string;
  linkedBankAccountId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Contact
```typescript
{
  id: string;
  userId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  document?: string;          // DNI/CUIT
  cbu?: string;
  alias?: string;
  bank?: Bank;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔐 Seguridad

- ✅ Todas las operaciones requieren autenticación
- ✅ Se valida que pertenecen al usuario
- ✅ No se pueden eliminar cuentas con transacciones
- ✅ Cambios son registrados con timestamps
- ✅ Se pueden marcar transacciones sospechosas

---

## 🎨 Enums Disponibles

### Bancos
```
banco_nacion, banco_provincia, bbva, santander, icbc, hsbc, itau,
nuevo_banco_bsa, macro, scotiabank, banco_galicia, brubank, ual,
wisfy, rebanking, otro_banco
```

### Wallets
```
mercado_pago, paypal, ualá, brubank, bnext, uphold, skrill, neteller,
otro_wallet
```

### Tipos de Cuenta Bancaria
```
checking - Cuenta Corriente
savings - Caja de Ahorro
investment - Inversión
credit_card - Tarjeta de Crédito
debit_card - Tarjeta de Débito
```

### Métodos de Pago
```
bank_transfer, debit_card, credit_card, cash, wallet, check,
cryptocurrency, other
```

---

## 📈 Próximos Pasos Recomendados

1. **Crear página de gestión de cuentas**
   - `/accounts` - Listado y formulario

2. **Crear página de transacciones mejorada**
   - Uso del nuevo sistema de detección
   - Visualización de flags sospechosos

3. **Dashboard ejecutivo**
   - Total de patrimonio
   - Ingresos vs egresos
   - Categorización visual

4. **Reportes**
   - Reporte mensual
   - Análisis por categoría
   - Tendencias

5. **Integración bancaria**
   - API con bancos
   - Sincronización automática

---

## ✨ Testing

Para probar el sistema, puedes usar las server actions directamente:

```typescript
// En cualquier page.tsx o component.tsx

import { createBankAccount } from "@/core/actions/bank-accounts";

export default async function TestPage() {
  const result = await createBankAccount({
    accountName: "Test Account",
    bank: "bbva",
    accountType: "savings",
    accountNumber: "123456",
    currency: "ARS",
    balance: "10000",
    ownerName: "Test User"
  });
  
  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}
```

---

## 📞 Troubleshooting

### Error: "No autenticado"
- Asegúrate de que el usuario está logueado
- Verifica que `session?.user?.id` existe

### Error: "Cuenta no encontrada"
- Verifica que el ID de la cuenta es correcto
- Asegúrate de que pertenece al usuario actual

### Transacción no se detecta correctamente
- Verifica la descripción (palabras clave)
- Revisa que los IDs de cuentas son correctos
- Consulta `detectTransactionType()` para debug

---

**¡Sistema completamente implementado y listo para usar! 🎉**
