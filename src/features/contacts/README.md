# Contacts Feature

Contact management module for the finance app. Stores and manages contact information for quick transaction recipient/sender lookup, payment tracking, and expense categorization.

## Overview

The contacts feature provides:

- **Contact Management**: CRUD operations for financial contacts
- **Rich Contact Details**: Name, email, phone, document ID, bank/wallet details
- **Contact Organization**: Folder-based grouping and categorization
- **Favorite Contacts**: Quick access to frequently used contacts
- **Financial Information**: CBU, IBAN, bank account details, wallet addresses
- **Idempotency**: Prevent duplicate contacts on retry
- **Search Functionality**: Find contacts by name, email, CBU, alias

## Architecture

### Directory Structure

```
contacts/
├── actions/           # Server actions (async operations, auth)
│   └── contacts.ts
├── components/        # React components for UI
│   └── ContactManager.tsx
├── hooks/            # Custom React hooks
│   └── (hooks specific to contacts)
├── index.ts          # Public API exports
└── README.md         # This file
```

### Key Entities

#### Contact

Basic contact information with financial details for transaction recipients/senders.

#### Contact Folder

Organizational grouping for contacts (e.g., "Vendors", "Family", "Services").

#### Contact Folder Members

Junction table linking contacts to folders for many-to-many relationships.

## Server Actions

All async operations require authentication. Returned as `Result<T, AppError>` for unified error handling.

### createContact(data)

Creates a new contact with validation and idempotency.

**Parameters**:

- `name: string` - Full contact name
- `firstName?: string` - First name (optional separate field)
- `lastName?: string` - Last name (optional separate field)
- `displayName?: string` - Display name for UI
- `email?: string` - Email address
- `phoneNumber?: string` - Phone number
- `document?: string` - Document ID (DNI, RUC, etc.)
- `cbu?: string` - CBU (Argentina, 22 digits)
- `alias?: string` - CBU alias for transfers
- `iban?: string` - IBAN (for international transfers)
- `bank?: string` - Associated bank name
- `accountNumber?: string` - Bank account number
- `bankAccountType?: string` - Account type (checking, savings)
- `isFavorite?: boolean` - Mark as favorite (default: false)
- `notes?: string` - Additional metadata
- `idempotencyKey?: string` - Optional custom idempotency key

**Returns**: `Result<Contact, AppError>`

**Validation**:

- User authentication
- Contact name is non-empty
- Email format (if provided)
- Phone format (if provided)
- CBU format (if provided): 22 digits
- IBAN format (if provided): valid structure
- Idempotency prevents duplicates

### getContacts()

Retrieves all contacts for the user.

**Returns**: `Result<Contact[], AppError>`

**Includes**:

- All contact details
- Bank/wallet account information
- Favorite status
- Timestamps

**Ordering**:

- Favorites first (if implemented)
- Then alphabetical by name

### searchContacts(searchTerm)

Searches contacts by keyword across multiple fields.

**Parameters**:

- `searchTerm: string` - Search keyword (case-insensitive, partial match)

**Searches**:

- Full name
- First/last names
- Display name
- Email address
- CBU and CBU alias

**Returns**: `Result<Contact[], AppError>`

**Use cases**:

- Quick recipient lookup during transaction
- Contact manager search box
- Auto-complete for recipient field

### createContactFolder(data)

Creates a folder for organizing contacts.

**Parameters**:

- `name: string` - Folder name
- `description?: string` - Folder description

**Returns**: `Result<ContactFolder, AppError>`

**Validation**:

- Folder name is non-empty
- Unique per user (no duplicate folder names)

### addContactToFolder(data)

Adds a contact to a folder.

**Parameters**:

- `contactId: string` - Contact to add
- `folderId: string` - Target folder

**Returns**: `Result<void, AppError>`

**Validation**:

- Contact exists and belongs to user
- Folder exists and belongs to user
- Contact not already in folder (optional constraint)

**Allows**:

- Contacts in multiple folders
- Empty folders
- Most contacts in no folder

### removeContactFromFolder(data)

Removes contact from folder without deleting contact.

**Parameters**:

- `contactId: string` - Contact to remove
- `folderId: string` - Source folder

**Returns**: `Result<void, AppError>`

### updateContact(contactId, data)

Updates existing contact with partial data.

**Parameters**:

- `contactId: string` - Contact to update
- `data: Partial<Contact>` - Fields to update

**Updatable fields**:

- Name and display name
- Email and phone
- Document ID
- Financial details (CBU, IBAN, account info)
- Favorite status
- Notes

**Returns**: `Result<Contact, AppError>`

**Validation**:

- Contact exists and belongs to user
- Updated data is valid
- Email format (if changed)
- Phone format (if changed)

### deleteContact(contactId)

Permanently deletes a contact.

**Parameters**:

- `contactId: string` - Contact to delete

**Returns**: `Result<void, AppError>`

**Notes**:

- Removes contact from all folders
- Does not delete transactions referencing contact
- Irreversible operation

### searchContactByCBUOrAlias(searchTerm)

Quick lookup for contact by financial identifier.

**Parameters**:

- `searchTerm: string` - CBU or alias to search

**Returns**: Contact if found, null otherwise

**Use cases**:

- Verify recipient before transfer
- Auto-complete for CBU field
- Recipient lookup by alias

## Data Models

### Contact Schema

```typescript
interface Contact {
  id: string; // Unique identifier
  userId: string; // Owner user ID
  name: string; // Full name (required)
  firstName?: string; // First name
  lastName?: string; // Last name
  displayName?: string; // Display in UI
  email?: string; // Email address
  phoneNumber?: string; // Phone number
  document?: string; // Document ID (DNI, RUC)
  cbu?: string; // CBU (22 digits)
  alias?: string; // CBU alias
  iban?: string; // IBAN
  bank?: string; // Associated bank
  accountNumber?: string; // Bank account number
  bankAccountType?: string; // Account type
  isFavorite: boolean; // Favorite flag
  notes?: string; // Custom metadata
  idempotencyKey: string; // Duplicate prevention
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modification
}
```

### ContactFolder Schema

```typescript
interface ContactFolder {
  id: string; // Unique identifier
  userId: string; // Owner user ID
  name: string; // Folder name
  description?: string; // Folder description
  contactCount?: number; // Count of members
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modification
}
```

### ContactFolderMember Schema

```typescript
interface ContactFolderMember {
  contactId: string; // Contact ID
  folderId: string; // Folder ID
  addedAt: Date; // When added
  // Composite primary key: (contactId, folderId)
}
```

### Document Type

```typescript
type DocumentType =
  | "dni" // DNI (Argentina)
  | "nif" // NIF (Spain)
  | "ruc" // RUC (Peru)
  | "cpf" // CPF (Brazil)
  | "passport"
  | "other";
```

## Validation Rules

### Name

- Required, non-empty
- Recommended max 100 characters
- Can contain letters, numbers, spaces, special characters

### Email

- Optional but recommended
- Valid email format
- @ and domain required

### Phone Number

- Optional
- Format varies by country
- Supports +XX format

### CBU

- Optional (but common for Argentina)
- Must be exactly 22 digits
- Validated with proper algorithm

### IBAN

- Optional (for international)
- Validated against IBAN standard
- Format: 2 letters + 2 digits + alphanumeric

### Favorite Status

- Boolean flag
- Used for UI sorting/filtering
- Helpful for frequently used contacts

## Error Handling

All functions return `Result<T, AppError>` with specific error types:

```typescript
// Authorization errors
authorizationError("contacts");

// Not found errors
notFoundError("contact", contactId);

// Validation errors
validationError("contact", "Email format invalid");

// Database errors
databaseError("insert", "Error creating contact");
```

## Usage Examples

### Create a contact

```typescript
const result = await createContact({
  name: "Juan Pérez",
  email: "juan@example.com",
  phoneNumber: "+54 011 1234-5678",
  cbu: "0170123456789012345678",
  alias: "juan.perez",
  bank: "Banco Galicia",
  accountNumber: "1234567890",
  isFavorite: true,
  notes: "Work colleague",
});

if (result.isOk()) {
  console.log("Contact created:", result.value.id);
} else {
  console.error("Error:", result.error.message);
}
```

### Search for a contact

```typescript
const result = await searchContacts("juan");

if (result.isOk()) {
  console.log(`Found ${result.value.length} contacts`);
  result.value.forEach((contact) => {
    console.log(contact.name, contact.email);
  });
}
```

### Get all contacts

```typescript
const result = await getContacts();

if (result.isOk()) {
  const favorites = result.value.filter((c) => c.isFavorite);
  console.log(`${favorites.length} favorite contacts`);
}
```

### Organize with folders

```typescript
// Create a folder
const folderResult = await createContactFolder({
  name: "Vendors",
  description: "Regular service providers",
});

if (folderResult.isOk()) {
  const folderId = folderResult.value.id;

  // Add contact to folder
  const addResult = await addContactToFolder({
    contactId: "contact_123",
    folderId: folderId,
  });
}
```

### Quick lookup by CBU

```typescript
const contact = await searchContactByCBUOrAlias("juan.perez");

if (contact) {
  console.log(`Transfer to: ${contact.name}`);
  console.log(`Bank: ${contact.bank}`);
} else {
  console.log("Contact not found");
}
```

### Update contact

```typescript
const result = await updateContact("contact_123", {
  email: "newemail@example.com",
  isFavorite: true,
});

if (result.isOk()) {
  console.log("Contact updated");
}
```

## Integration Points

### With Transactions

- Auto-resolves recipient/sender labels
- Enables quick transaction creation
- Categorizes transactions by contact
- Shows contact in transaction history

### With Bank Accounts

- Stores bank account details for contacts
- Links accounts to recipients
- Enables quick verification before transfer

### With Digital Wallets

- Stores wallet addresses for contacts
- Supports wallet-to-wallet transfers
- Links wallet accounts to contacts

### With Expense Tracking

- Categorizes expenses by contact
- Calculates spending per vendor
- Identifies frequent payments

## Performance Considerations

- **Search optimization**: Indexed on name, email, CBU
- **Folder queries**: Cached folder structure in state
- **Favorite filtering**: User-driven, not database-side
- **Batch operations**: Support for bulk contact import

## Security Measures

- All operations require authentication
- User ID validation on all queries
- Sensitive data validated carefully
- Document ID format validation
- Phone/email format validation
- Delete operations logged for audit
- Contact sharing future: permissions-based

## Typical User Workflows

### Setting Up Contacts

1. Create first contact (frequent recipient)
2. Verify CBU/IBAN is correct
3. Mark as favorite for quick access
4. Add notes about relationship

### Organizing Contacts

1. Create folders (Vendors, Family, Services)
2. Add contacts to relevant folders
3. Use folders to filter transaction recipients
4. Update folder descriptions

### Transaction Workflow

1. Start transaction creation
2. Search contacts by name or CBU
3. Select recipient from contact list
4. Verify account details before confirming
5. Transaction auto-links to contact

## Future Enhancements

- [ ] Contact profiles with photo
- [ ] Contact sharing with permissions
- [ ] vCard import/export
- [ ] Contact sync with address book
- [ ] Contact reputation scoring
- [ ] Bank account verification
- [ ] Contact groups with multiple members
- [ ] Contact activity timeline
- [ ] Contact-based transaction templates
