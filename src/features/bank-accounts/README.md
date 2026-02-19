# Bank Accounts Feature

Bank account management module for the finance app. Handles creation, maintenance, and tracking of user bank accounts with balance management and metadata storage.

## Overview

The bank-accounts feature provides:

- **Account Management**: CRUD operations for bank accounts
- **Multi-Bank Support**: Any bank/institution support with flexible fields
- **Currency Support**: Multi-currency accounts (ARS, USD, EUR, etc.)
- **Balance Tracking**: Current balance and historical snapshots
- **Idempotency**: Prevent duplicate accounts on retry
- **Account Identification**: CBU, IBAN, alias, and account number support
- **Metadata Storage**: Custom notes and owner information

## Architecture

### Directory Structure

```
bank-accounts/
├── actions/           # Server actions (async operations, auth)
│   └── bank-accounts.ts
├── components/        # React components for UI
│   └── BankAccountManager.tsx
├── hooks/            # Custom React hooks
│   └── (hooks specific to bank accounts)
├── index.ts          # Public API exports
└── README.md         # This file
```

### Key Components

#### BankAccountManager

Component providing complete bank account CRUD operations:

- Account creation form with validation
- Account list with balance display
- Edit functionality for account details
- Safe delete with confirmation
- Error handling and user feedback

## Server Actions

All async operations require authentication. Returned as `Result<T, AppError>` for unified error handling.

### createBankAccount(data)

Creates a new bank account with validation.

**Parameters**:

- `accountName: string` - Friendly name (e.g., "Mi Cuenta Sueldo")
- `bank: string` - Bank name (e.g., "Banco Galicia")
- `accountType: string` - Type (checking, savings, money_market)
- `accountNumber: string` - Account number (bank-specific format)
- `cbu?: string` - CBU (Argentina, 22 digits)
- `alias?: string` - CBU alias for transfers
- `iban?: string` - IBAN (for international transfers)
- `currency: string` - Currency code (ARS, USD, EUR, etc.)
- `balance: string` - Current balance (non-negative numeric)
- `ownerName: string` - Account owner full name
- `ownerDocument?: string` - Owner document ID (DNI, NIF, RUC)
- `notes?: string` - Additional metadata notes
- `idempotencyKey?: string` - Optional custom idempotency key

**Returns**: `Result<BankAccount, AppError>`

**Validation**:

- User authentication
- Account number non-empty
- CBU format (if provided): 22 digits
- IBAN format (if provided): valid IBAN structure
- Currency code validity
- Balance is numeric and non-negative
- Owner name is non-empty

**Idempotency**:

- Prevents duplicate accounts with identical details
- Returns existing account if already created
- Key generated from account details if not provided

### getBankAccounts()

Retrieves all bank accounts for the user.

**Returns**: `Result<BankAccount[], AppError>`

**Includes**:

- All account details
- Current balance
- Creation/update timestamps

### updateBankAccount(accountId, data)

Updates existing bank account with partial data.

**Parameters**:

- `accountId: string` - ID of account to update
- `data: Partial<BankAccount>` - Fields to update

**Updatable fields**:

- Account name
- CBU, alias, IBAN
- Balance (manually)
- Notes and metadata
- Owner information (when verified)

**Returns**: `Result<BankAccount, AppError>`

**Validation**:

- Account exists and belongs to user
- Updated data is valid
- New data doesn't violate uniqueness constraints

### deleteBankAccount(accountId)

Permanently deletes a bank account and all associated transactions.

**Parameters**:

- `accountId: string` - ID of account to delete

**Returns**: `Result<void, AppError>`

**WARNING**:

- Irreversible operation
- All transaction history deleted
- All metadata deleted
- Cannot be undone

**Validation**:

- Account exists and belongs to user
- User confirms deletion intention

### updateBankAccountBalance(accountId, newBalance)

Directly updates the account balance without transaction creation.

**Parameters**:

- `accountId: string` - ID of account
- `newBalance: string` - New balance value (numeric string)

**Returns**: `Result<void, AppError>`

**Use cases**:

- Account sync operations
- Manual balance corrections
- Initial balance setup

**Validation**:

- Account exists and belongs to user
- Balance is numeric and non-negative

**Note**: Does not create transaction records. For normal operations, use transaction creation which automatically updates balances.

### searchBankAccountByCBUOrAlias(searchTerm)

Searches for bank accounts by CBU or alias.

**Parameters**:

- `searchTerm: string` - CBU or alias to search

**Returns**: Bank account if found, null otherwise

**Use cases**:

- Recipient lookup for transfers
- Account verification
- Quick account finding

## Data Models

### BankAccount Schema

```typescript
interface BankAccount {
  id: string; // Unique identifier
  userId: string; // Owner user ID
  accountName: string; // Friendly name
  bank: string; // Bank name/code
  accountType: string; // checking, savings, etc.
  accountNumber: string; // Bank-specific format
  cbu?: string; // CBU (22 digits for Argentina)
  alias?: string; // CBU alias (e.g., "alias.example")
  iban?: string; // IBAN for international
  currency: string; // ISO 4217 code
  balance: string; // Current balance
  ownerName: string; // Account holder name
  ownerDocument?: string; // DNI, NIF, RUC
  notes?: string; // Custom metadata
  idempotencyKey: string; // For duplicate prevention
  createdAt: Date; // Account creation date
  updatedAt: Date; // Last modification date
}
```

### Bank Types

```typescript
type Bank =
  | "banco_galicia"
  | "bbva"
  | "santander"
  | "scotiabank"
  | "hsbc"
  | "ciudad"
  | "nacion"
  | "macro"
  | "icbc"
  | "comafi"
  | "supervielle"
  | "bind"
  | "brubank"
  | "mercantil"
  | "other";
```

### Account Types

```typescript
type AccountType =
  | "checking" // Cuenta corriente
  | "savings" // Cuenta ahorro
  | "money_market" // Cuenta de inversión
  | "credit" // Tarjeta de crédito
  | "debit" // Tarjeta de débito
  | "line_of_credit" // Línea de crédito
  | "other";
```

## Validation Rules

### Account Name

- Required, non-empty
- Recommended max 50 characters
- Can contain letters, numbers, spaces, special characters

### Account Number

- Required, non-empty
- Format depends on bank/country
- Must be unique per user

### CBU (Clave Bancaria Uniforme)

- Optional (but recommended for Argentina)
- Must be exactly 22 digits
- Validated with Luhn-like algorithm

### IBAN (International Bank Account Number)

- Optional (for international transfers)
- Validated against IBAN standard
- Supports IBAN variants by country

### Currency

- Required, valid ISO 4217 code
- Examples: ARS, USD, EUR, GBP, BRL

### Balance

- Required, non-negative numeric
- Supports up to 2 decimal places
- Treated as precise decimal, not float

## Error Handling

All functions return `Result<T, AppError>` with specific error types:

```typescript
// Authorization errors
authorizationError("bank_accounts");

// Not found errors
notFoundError("bank_account", accountId);

// Validation errors
validationError("bank_account", "CBU format invalid");

// Database errors
databaseError("insert", "Error creating account");
```

## Usage Examples

### Create a bank account

```typescript
const result = await createBankAccount({
  accountName: "Mi Cuenta Sueldo",
  bank: "banco_galicia",
  accountType: "checking",
  accountNumber: "1234567890",
  cbu: "0170123456789012345678",
  alias: "juan.perez",
  currency: "ARS",
  balance: "5000",
  ownerName: "Juan Pérez",
  ownerDocument: "12345678",
});

if (result.isOk()) {
  console.log("Account created:", result.value.id);
} else {
  console.error("Error:", result.error.message);
}
```

### Update account details

```typescript
const result = await updateBankAccount("account_123", {
  alias: "newalias",
  notes: "Primary salary account",
});

if (result.isOk()) {
  console.log("Account updated");
}
```

### Get all accounts

```typescript
const result = await getBankAccounts();

if (result.isOk()) {
  result.value.forEach((account) => {
    console.log(
      `${account.accountName}: ${account.balance} ${account.currency}`,
    );
  });
}
```

### Sync balance from bank API

```typescript
// After fetching from bank API
const syncResult = await updateBankAccountBalance(
  accountId,
  latestBankBalance.toString(),
);

if (syncResult.isOk()) {
  console.log("Balance synchronized");
}
```

### Delete an account

```typescript
const result = await deleteBankAccount("account_123");

if (result.isOk()) {
  console.log("Account deleted permanently");
  // Note: All transactions deleted too
} else {
  console.error("Deletion failed:", result.error.message);
}
```

## Integration Points

### With Transactions

- Validates account ownership during transaction creation
- Updates balance on transaction confirmation
- Supports multi-currency transactions

### With Contacts

- Stores account details for recipients
- Links contacts to specific bank accounts
- Enables quick transfer setup

### With Digital Wallets

- Allows transfers to/from wallets
- Tracks linked wallet references
- Manages currency conversion

### With Savings Goals

- Links accounts to goals
- Calculates goal progress
- Prevents overfunding

## Performance Considerations

- **Database indexes**: userId, CBU, alias for fast lookups
- **Balance updates**: Direct DB update, no transaction creation
- **Query optimization**: Select only needed fields when possible
- **Caching**: Account list cached in component state

## Security Measures

- All operations require authentication
- User ID validation on all queries
- Idempotency prevents accidental duplicates
- Sensitive data (account numbers) logged carefully
- Delete operations logged for audit trail
- Balance changes tracked with timestamps

## API Versioning

Current implementation: v1

- Uses drizzle query syntax
- Result<T, AppError> pattern
- Server actions (NextJS)

## Future Enhancements

- [ ] Account reconnect via bank API
- [ ] Real-time balance synchronization
- [ ] Account statement import
- [ ] Multi-signature support
- [ ] Account sharing with permissions
- [ ] Account archival (soft delete)
- [ ] Balance history snapshots
- [ ] Account overdraft tracking
