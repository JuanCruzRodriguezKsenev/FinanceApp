# Transactions Feature

Comprehensive transaction management module for the finance app. Handles creation, retrieval, state management, and metadata tracking of financial transactions across multiple account types.

## Overview

The transactions feature provides:

- **Automatic Transaction Detection**: Intelligent type, category, and suspicious activity detection based on description analysis
- **State Machine Management**: Transaction workflow with multiple states (DRAFT, PENDING, CONFIRMED, REJECTED, RECONCILED, ARCHIVED)
- **Multi-Account Support**: Works with traditional accounts, bank accounts, and digital wallets
- **Metadata Tracking**: Flag transactions as suspicious with audit reasons
- **Idempotency**: Prevent duplicate transactions on retry with idempotency keys
- **Balance Management**: Automatic balance updates for source and destination accounts

## Architecture

### Directory Structure

```
transactions/
├── actions/           # Server actions (async operations, auth)
│   └── transactions.ts
├── components/        # React components for UI
│   ├── TransactionForm.tsx
│   ├── TransactionRow.tsx
│   ├── TransactionsSummary.tsx
│   └── ...
├── hooks/            # Custom React hooks
│   └── (hooks specific to transactions)
├── index.ts          # Public API exports
└── README.md         # This file
```

### Key Components

#### TransactionForm

Form component for creating and editing transactions with:

- Auto-detection of transaction type and category
- Support for multiple account types
- Currency validation and conversion
- Error handling and user feedback

#### TransactionRow

Renders individual transactions in a table with:

- Account/contact label resolution
- Transaction status indicators
- State-based action buttons
- Integration with state machine

#### TransactionsSummary

Dashboard widget displaying:

- Total income, expenses, and balance
- Period-based filtering (daily, weekly, monthly)
- Navigation to detailed statistics

## Server Actions

All async operations require authentication. Returned as `Result<T, AppError>` for unified error handling.

### createTransaction(formData: FormData)

Legacy method for form-based transaction creation. Use `createTransactionWithAutoDetection` for new code.

**Returns**: `Result<void, AppError>`

### createTransactionWithAutoDetection(data)

Creates transactions with intelligent auto-detection.

**Parameters**:

- `amount: number` - Transaction amount
- `description: string` - Used for category/type detection
- `date: Date` - Transaction date
- `currency?: string` - Currency (default: ARS)
- `fromAccountId?: string` - Source account
- `toAccountId?: string` - Destination account
- Multiple account type support (bank accounts, digital wallets)
- `category?: TransactionCategory` - Override auto-detection
- `type?: TransactionType` - Override auto-detection

**Returns**: `Result<Transaction, AppError>`

**Detects**:

- Type: income, expense, transfer_own_accounts, transfer_third_party, withdrawal, deposit
- Category: 30+ categories (food, transport, utilities, entertainment, etc.)
- Suspicious activity: unusual amounts, frequencies, patterns

**Validation**:

- User authentication
- Account ownership verification
- Currency compatibility
- Amount positivity

### updateBalancesAfterTransaction(transactionId)

Updates account/wallet balances after transaction confirmation.

**Parameters**:

- `transactionId: string` - Transaction to process

**Returns**: `Result<void, AppError>`

**Handles**:

- Outflow transactions (reduces source balance)
- Inflow transactions (increases destination balance)
- Transfers (both source and destination)
- Multiple account types

### getTransactionsWithMetadata()

Retrieves all user transactions with associated metadata.

**Returns**: `Result<Array<Transaction & { metadata?: any }>, AppError>`

**Includes**:

- Complete transaction details
- Suspicious flags and reasons
- Custom metadata if available

### flagTransactionAsSuspicious(transactionId, reason)

Marks a transaction for manual review.

**Parameters**:

- `transactionId: string` - Transaction to flag
- `reason: string` - Human-readable reason for flag

**Returns**: `Result<void, AppError>`

**Reasons may include**:

- Unusual amounts (very high/low)
- Unusual frequency
- Pattern anomalies
- User-defined concerns

### getTransactions(filters?)

Retrieves user transactions with optional filtering.

**Filters**:

- Date range
- Transaction type
- Category
- Account
- Amount range

**Returns**: `Result<Transaction[], AppError>`

### deleteTransaction(transactionId)

Permanently deletes a transaction and updates balances.

**Returns**: `Result<void, AppError>`

### State Machine Methods

- `submitTransaction(transactionId)` - Move to PENDING
- `confirmTransaction(transactionId)` - Move to CONFIRMED
- `rejectTransaction(transactionId)` - Move to REJECTED
- `cancelTransaction(transactionId)` - Move to ARCHIVED
- `reconcileTransaction(transactionId)` - Move to RECONCILED

## Data Models

### Transaction Type

```typescript
type TransactionType =
  | "income"
  | "expense"
  | "transfer_own_accounts"
  | "transfer_third_party"
  | "withdrawal"
  | "deposit";
```

### Transaction Category

```typescript
type TransactionCategory =
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "shopping"
  | "health"
  | "education"
  | "salary"
  | "investment"
  | "other";
// ... 20+ more categories
```

### Transaction State

```typescript
enum TransactionState {
  DRAFT = "draft", // Initial state
  PENDING = "pending", // Awaiting confirmation
  CONFIRMED = "confirmed", // Transaction applied
  REJECTED = "rejected", // User rejected
  RECONCILED = "reconciled", // Verified against bank
  ARCHIVED = "archived", // Historical
}
```

## Validation Rules

### Amount

- Must be positive number
- Supports up to 2 decimal places
- BigDecimal-safe handling for precision

### Date

- Must be valid ISO date
- Cannot be in the future (depends on transaction type)

### Accounts

- Must belong to authenticated user
- Source and destination must be different for transfers
- Multi-currency transfers use detected rates

### Descriptions

- Used for category detection (30+ keyword patterns)
- Checked for suspicious activity patterns
- Min 3 characters recommended

## Error Handling

All functions return `Result<T, AppError>` with specific error types:

```typescript
// Authorization errors
authorizationError("transactions"); // User not authenticated

// Validation errors
validationError("form", "Campos faltantes");

// Not found errors
notFoundError("transaction", transactionId);

// Database errors
databaseError("insert", "Error creating transaction");
```

## Usage Examples

### Create a transaction with auto-detection

```typescript
const result = await createTransactionWithAutoDetection({
  amount: 500,
  currency: "ARS",
  description: "Compra en MercadoLibre",
  date: new Date(),
  fromBankAccountId: "bank_123",
});

if (result.isOk()) {
  const transaction = result.value;
  console.log(`Created ${transaction.type}: ${transaction.category}`);
} else {
  console.error(`Error: ${result.error.message}`);
}
```

### Get and update balances

```typescript
const transactionResult = await createTransactionWithAutoDetection({...});

if (transactionResult.isOk()) {
  const balanceResult = await updateBalancesAfterTransaction(
    transactionResult.value.id
  );

  if (balanceResult.isOk()) {
    console.log('Balances updated');
  }
}
```

### Search for suspicious transactions

```typescript
const result = await getTransactionsWithMetadata();

if (result.isOk()) {
  const suspicious = result.value.filter((txn) => txn.metadata?.isFlagged);
  console.log(`Found ${suspicious.length} suspicious transactions`);
}
```

### Manage transaction state

```typescript
// Submit for approval
await submitTransaction(transactionId);

// Confirm transaction (updates balances, state -> CONFIRMED)
await confirmTransaction(transactionId);

// Reject transaction (reverts changes, state -> REJECTED)
await rejectTransaction(transactionId);
```

## Integration Points

### With Bank Accounts

- Validates account ownership
- Updates balances on confirmation
- Supports currency conversion if needed

### With Digital Wallets

- Creates transactions between wallets
- Updates wallet balances
- Tracks wallet-specific metadata

### With Contacts

- Auto-resolves recipient/sender labels
- Categorizes transactions by contact type
- Supports contact-based filtering

### With Savings Goals

- Updates goal progress when transactions match
- Calculates goal contribution amounts
- Prevents overfunding goals

## Performance Considerations

- **Database queries**: Indexed on userId, transactionId, date ranges
- **Auto-detection**: Linear keyword scanning (30+ patterns)
- **Balance updates**: Single record modification per account
- **Metadata queries**: Optional join only when needed

## Security

- All operations require authentication
- User ID validation on all database queries
- Idempotency prevents accidental duplicates
- Suspicious transaction metadata logged for audit
- Failed operations don't leave partial state

## Future Enhancements

- [ ] Recurring transaction templates
- [ ] Bulk transaction import/export
- [ ] Advanced ML-based categorization
- [ ] Real-time transaction sync with bank APIs
- [ ] Multi-currency conversion optimization
- [ ] Transaction scheduling
- [ ] Budget impact prediction
