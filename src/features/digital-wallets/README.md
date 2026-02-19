# Digital Wallets Feature

Digital wallet management module for the finance app. Handles creation, maintenance, and balance management for digital payment providers and apps.

## Overview

The digital-wallets feature provides:

- **Wallet Management**: CRUD operations for digital wallets
- **Multi-Provider Support**: MercadoPago, PayPal, Stripe, Wise, and more
- **Balance Tracking**: Current balance and historical records
- **Currency Support**: Multi-currency wallets
- **Account Linking**: Link wallets to bank accounts for transfers
- **Idempotency**: Prevent duplicate wallets on retry
- **Identification**: Username, email, phone support per provider
- **Metadata Storage**: Custom notes and contact information

## Architecture

### Directory Structure

```
digital-wallets/
├── actions/           # Server actions (async operations, auth)
│   └── digital-wallets.ts
├── components/        # React components for UI
│   └── DigitalWalletManager.tsx
├── hooks/            # Custom React hooks
│   └── (hooks specific to digital wallets)
├── index.ts          # Public API exports
└── README.md         # This file
```

### Supported Providers

- **MercadoPago**: Latin America payments, wallets, transfers
- **PayPal**: International payments, invoicing
- **Stripe**: Online payment processing
- **Square**: Point-of-sale, online payments
- **Wise**: International transfers, multi-currency
- **Google Pay**: Mobile tap payments
- **Apple Pay**: iOS mobile payments
- **Crypto Wallets**: Bitcoin, Ethereum, USDC, etc.
- **Custom**: Any provider type

## Server Actions

All async operations require authentication. Returned as `Result<T, AppError>` for unified error handling.

### createDigitalWallet(data)

Creates a new digital wallet with validation and idempotency.

**Parameters**:

- `walletName: string` - Friendly name (e.g., "Mi MercadoPago")
- `provider: string` - Payment provider identifier
- `email?: string` - Associated email address
- `phoneNumber?: string` - Associated phone number
- `username?: string` - Provider username or account ID
- `currency: string` - Currency code (ARS, USD, EUR, etc.)
- `balance: string` - Current wallet balance
- `linkedBankAccountId?: string` - Associated bank account for transfers
- `idempotencyKey?: string` - Optional custom idempotency key

**Returns**: `Result<DigitalWallet, AppError>`

**Validation**:

- User authentication
- Wallet name is non-empty
- Provider is valid and supported
- Email format (if provided)
- Phone format (if provided)
- Currency code validity
- Balance is numeric and non-negative
- Linked account (if provided) belongs to user

**Idempotency**:

- Prevents duplicate wallets with identical details
- Returns existing wallet if already created
- Key generated from wallet details if not provided

### getDigitalWallets()

Retrieves all digital wallets for the user.

**Returns**: `Result<DigitalWallet[], AppError>`

**Includes**:

- All wallet details
- Current balance
- Provider information
- Creation/update timestamps
- Linked bank account reference

### updateDigitalWallet(walletId, data)

Updates existing wallet with partial data.

**Parameters**:

- `walletId: string` - ID of wallet to update
- `data: Partial<DigitalWallet>` - Fields to update

**Updatable fields**:

- Wallet name
- Provider contact info (email, phone, username)
- Balance (manually)
- Linked bank account
- Custom notes

**Returns**: `Result<DigitalWallet, AppError>`

**Validation**:

- Wallet exists and belongs to user
- Updated data is valid
- Email/phone format if changed
- Linked account exists if changed

### deleteDigitalWallet(walletId)

Permanently deletes a wallet and all associated transactions.

**Parameters**:

- `walletId: string` - ID of wallet to delete

**Returns**: `Result<void, AppError>`

**WARNING**:

- Irreversible operation
- All transaction history deleted
- All metadata deleted
- Cannot be undone

**Validation**:

- Wallet exists and belongs to user
- User confirms deletion intention

### updateWalletBalance(walletId, newBalance)

Directly updates the wallet balance without transaction creation.

**Parameters**:

- `walletId: string` - ID of wallet
- `newBalance: string` - New balance value (numeric string)

**Returns**: `Result<void, AppError>`

**Use cases**:

- Wallet sync operations
- Manual balance corrections
- Provider balance updates
- Initial balance import

**Validation**:

- Wallet exists and belongs to user
- Balance is numeric and non-negative

**Note**: Does not create transaction records. For normal operations, use transaction creation which automatically updates balances.

## Data Models

### DigitalWallet Schema

```typescript
interface DigitalWallet {
  id: string; // Unique identifier
  userId: string; // Owner user ID
  walletName: string; // Friendly name
  provider: string; // Provider identifier
  email?: string; // Associated email
  phoneNumber?: string; // Associated phone
  username?: string; // Provider username
  currency: string; // ISO 4217 code
  balance: string; // Current balance
  linkedBankAccountId?: string; // Linked bank account
  idempotencyKey: string; // Duplicate prevention
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modification
}
```

### Provider Types

```typescript
type WalletProvider =
  | "mercadopago"
  | "paypal"
  | "stripe"
  | "square"
  | "wise"
  | "google_pay"
  | "apple_pay"
  | "bitcoin"
  | "ethereum"
  | "usdc"
  | "binance"
  | "coinbase"
  | "other";
```

### Provider Configuration

```typescript
interface ProviderConfig {
  id: string;
  name: string;
  requiresEmail: boolean;
  requiresUsername: boolean;
  supportsTransfers: boolean;
  supportedCurrencies: string[];
  minBalance?: number;
  maxBalance?: number;
}
```

## Validation Rules

### Wallet Name

- Required, non-empty
- Recommended max 50 characters
- Can contain letters, numbers, spaces, special characters

### Provider

- Required, must be in supported list
- Case-sensitive identifier
- Examples: 'mercadopago', 'paypal_business'

### Email

- Optional (depends on provider)
- Valid email format required if provided
- Used for provider account identification

### Phone Number

- Optional (depends on provider)
- Format varies by country
- Supports +XX format

### Username

- Optional (depends on provider)
- Provider-specific format
- Unique per provider within user

### Currency

- Required, valid ISO 4217 code
- Examples: ARS, USD, EUR, BRL, UYU
- Must match provider capabilities

### Balance

- Required, non-negative numeric
- Supports up to 2 decimal places or 8 decimals (for crypto)
- Treated as precise decimal, not float

## Error Handling

All functions return `Result<T, AppError>` with specific error types:

```typescript
// Authorization errors
authorizationError("digital_wallets");

// Not found errors
notFoundError("digital_wallet", walletId);

// Validation errors
validationError("wallet", "Email format invalid");

// Database errors
databaseError("insert", "Error creating wallet");
```

## Usage Examples

### Create a digital wallet

```typescript
const result = await createDigitalWallet({
  walletName: "Mi MercadoPago",
  provider: "mercadopago",
  email: "user@example.com",
  username: "jperez",
  currency: "ARS",
  balance: "1250.50",
  linkedBankAccountId: "account_123",
});

if (result.isOk()) {
  console.log("Wallet created:", result.value.id);
} else {
  console.error("Error:", result.error.message);
}
```

### Get all wallets

```typescript
const result = await getDigitalWallets();

if (result.isOk()) {
  const totalBalance = result.value.reduce((sum, wallet) => {
    return sum + parseFloat(wallet.balance);
  }, 0);

  console.log(`Total in wallets: ${totalBalance}`);
}
```

### Update wallet

```typescript
const result = await updateDigitalWallet("wallet_123", {
  email: "newemail@example.com",
  phoneNumber: "+54 011 9999-9999",
});

if (result.isOk()) {
  console.log("Wallet updated");
}
```

### Sync balance from provider

```typescript
// After fetching from provider API
const syncResult = await updateWalletBalance(
  walletId,
  latestProviderBalance.toString(),
);

if (syncResult.isOk()) {
  console.log("Balance synchronized");
}
```

### Delete a wallet

```typescript
const result = await deleteDigitalWallet("wallet_123");

if (result.isOk()) {
  console.log("Wallet deleted permanently");
  // Note: All transactions deleted too
} else {
  console.error("Deletion failed:", result.error.message);
}
```

## Integration Points

### With Transactions

- Validates wallet ownership during transaction creation
- Updates balance on transaction confirmation
- Supports wallet-to-wallet transfers
- Tracks spending by wallet provider

### With Bank Accounts

- Links wallet to bank account for transfers
- Enables transfers between bank and wallet
- Tracks linked account in metadata

### With Contacts

- Stores wallet addresses for contacts
- Enables quick wallet-based payments
- Links wallet addresses to known contacts

### With Savings Goals

- Links wallets to goals
- Calculates goal progress
- Tracks savings by wallet

### Provider APIs (Future)

- Real-time balance sync
- Automatic transaction import
- Direct payment capability
- Notification webhooks

## Performance Considerations

- **Database indexes**: userId, provider, email for fast lookups
- **Balance updates**: Direct DB update, no transaction creation
- **Query optimization**: Select only needed fields
- **Caching**: Wallet list cached in component state
- **Batch operations**: Support for bulk wallet import

## Security Measures

- All operations require authentication
- User ID validation on all queries
- Email/phone format validation
- Username format validation (per provider)
- Sensitive credentials NOT stored (app uses APIs)
- Balance updates timestamped for audit
- Delete operations logged
- Provider authentication via OAuth (future)

## Cryptocurrency Support

### Bitcoin Wallets

```typescript
const btcWallet = await createDigitalWallet({
  walletName: "Mi Bitcoin",
  provider: "bitcoin",
  username: "bc1q...", // Bitcoin address
  currency: "BTC",
  balance: "0.05",
});
```

### Ethereum Wallets

```typescript
const ethWallet = await createDigitalWallet({
  walletName: "Mi Ethereum",
  provider: "ethereum",
  username: "0x...", // Ethereum address
  currency: "ETH",
  balance: "2.5",
});
```

### Stablecoin (USDC)

```typescript
const usdcWallet = await createDigitalWallet({
  walletName: "Mi USDC",
  provider: "usdc",
  username: "0x...", // Wallet address
  currency: "USDC",
  balance: "1000",
});
```

## Multi-Currency Workflows

### Convert Between Wallets

```typescript
// Create transaction from USD wallet to ARS bank account
const result = await createTransactionWithAutoDetection({
  amount: 100,
  currency: "USD",
  description: "Convert to ARS",
  date: new Date(),
  fromWalletId: "wallet_usd",
  toBankAccountId: "account_ars",
  // App auto-detects type as transfer_own_accounts
});
```

### Track Multi-Currency Portfolio

```typescript
const wallets = await getDigitalWallets();

const byProvider = {};
wallets.forEach((w) => {
  if (!byProvider[w.provider]) {
    byProvider[w.provider] = [];
  }
  byProvider[w.provider].push({
    name: w.walletName,
    amount: w.balance,
    currency: w.currency,
  });
});

// Display organized by provider
```

## Typical User Workflows

### Setting Up Wallets

1. List all digital payment accounts user has
2. Create wallet entry for each with name
3. Enter current balance
4. Link to primary bank account if applicable
5. Mark as favorites if frequently used

### Tracking With Transactions

1. Create transactions from/to wallets
2. App auto-detects type and category
3. Balance updates automatically
4. View wallet-specific spending

### Multi-Wallet Portfolio

1. Create wallets for different purposes (savings, spending)
2. Use different providers for geographic distribution
3. Track total across all wallets
4. Make transfers between wallets

### Crypto Portfolio Tracking

1. Create wallets for different coins/tokens
2. Track price appreciation in notes
3. Update balances from blockchain
4. View total portfolio value

## Provider-Specific Features

### MercadoPago

- Supports ARS, USD, BRL, MXN, CLP, COP
- P2P transfers supported
- Invoicing capability
- Link prepaid card

### PayPal

- Multi-currency accounts
- Seller tools
- Bill payment setup
- Money market fund

### Stripe

- Connect seller accounts
- Express onboarding
- Custom branding
- API access

### Wise

- 80+ currencies
- Real exchange rates
- Business accounts
- API transfers

## Future Enhancements

- [ ] Direct provider API integration
- [ ] Real-time balance synchronization
- [ ] Provider webhook support
- [ ] Automatic transaction import
- [ ] Direct payment capability
- [ ] Multi-signature wallets
- [ ] Wallet security scoring
- [ ] Transaction fee tracking
- [ ] Currency conversion at transaction time
- [ ] Portfolio rebalancing suggestions
