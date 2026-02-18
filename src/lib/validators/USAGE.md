# Validators Library - Comprehensive Guide

## Overview

The validators library provides a type-safe, composable validation framework for all user input across the Finance App. It includes:

- **Type-safe validators** with TypeScript generics
- **Fluent builder API** for composing validators
- **Common field validators** for emails, passwords, amounts, CBU, etc.
- **Schema validation** for complete objects
- **Error collection** with detailed error information
- **Pre-built presets** for common use cases

## Architecture

```
src/lib/validators/
├── types.ts          # Core types and interfaces
├── fields.ts         # Common field validators
├── builder.ts        # Fluent validator builder
├── schema.ts         # Schema validation utilities
└── index.ts          # Exports and presets
```

## Usage Patterns

### 1. Single Field Validation

```typescript
import { stringValidators, passwordValidators } from "@/lib/validators";

// Using specific validators
const emailValidator = stringValidators.email();
const result = emailValidator("user@example.com");

if (result.success) {
  console.log("Valid email");
} else {
  console.log("Error:", result.error.message);
}

// Amount validation with constraints
const amountValidator = financialValidators.amount({
  min: 0.01,
  max: 100000,
  decimals: 2,
});

const amountResult = amountValidator(999.99);
```

### 2. Fluent Builder API

```typescript
import { createValidator } from "@/lib/validators";

// Build complex validators fluently
const passwordValidator = createValidator<string>("password")
  .required("Password is mandatory")
  .minLength(8, "Minimum 8 characters")
  .strongPassword("Must contain uppercase, lowercase, number, special")
  .build();

const emailValidator = createValidator<string>("email")
  .required()
  .email("Invalid email format")
  .build();

// Use
const pwdResult = passwordValidator("SecurePass123!");
const emailResult = emailValidator("user@example.com");
```

### 3. Schema Validation (Complete Objects)

```typescript
import { validateSchema, createValidator } from "@/lib/validators";
import {
  stringValidators,
  passwordValidators,
  financialValidators,
} from "@/lib/validators";

// Define schema
const registrationSchema: Schema<RegistrationForm> = {
  email: stringValidators.email(),
  password: passwordValidators.strong(),
  amount: financialValidators.amount({ min: 100, max: 100000 }),
};

// Validate entire object
const formData = {
  email: "user@example.com",
  password: "SecurePass123!",
  amount: 5000,
};

const result = await validateSchema(formData, registrationSchema);

if (result.hasErrors) {
  console.log("Validation errors:", result.getMessagesByField());
  // Output: {
  //   email: ['Invalid email'],
  //   password: []
  // }
} else {
  // Process form
}
```

### 4. In React Components

```typescript
'use client';

import { useState } from 'react';
import { createValidator, ValidationError } from '@/lib/validators';

const registrationValidator = createValidator<string>('email')
  .required()
  .email()
  .build();

export function RegisterForm() {
  const [formData, setFormData] = useState({ email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]: value}));

    // Validate on change
    const result = registrationValidator(value);
    if (!result.success) {
      setErrors(prev => ({...prev, [name]: result.error.message}));
    } else {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  return (
    <input
      name="email"
      value={formData.email}
      onChange={handleChange}
      className={errors.email ? 'error' : ''}
    />
  );
}
```

### 5. In Server Actions

```typescript
'use server';

import { validateSchema } from '@/lib/validators';
import { ok, err, validationError } from '@/lib/result';

export async function createBankAccount(
  data: CreateBankAccountInput
): Promise<Result<BankAccount, AppError>> {
  // Validate input
  const validationResult = await validateSchema(data, bankAccountSchema);

  if (validationResult.hasErrors) {
    return err(
      validationError(
        'form',
        'Validation failed',
        validationResult.getMessages()
      )
    );
  }

  // Proceed with creation
  try {
    const account = await db.bankAccounts.create({...});
    return ok(account);
  } catch (error) {
    return err(databaseError('insert', 'Failed to create account'));
  }
}
```

## Available Validators

### String Validators

```typescript
import { stringValidators } from "@/lib/validators";

// Text with length constraints
stringValidators.text({ min: 3, max: 100 });

// Email validation
stringValidators.email();

// URL validation
stringValidators.url();

// Phone number
stringValidators.phoneNumber();
```

### Password Validators

```typescript
import { passwordValidators } from "@/lib/validators";

// Strong password (8+ chars, uppercase, lowercase, number, special)
passwordValidators.strong();

// Basic password (6+ chars)
passwordValidators.basic();
```

### Financial Validators

```typescript
import { financialValidators } from "@/lib/validators";

// CBU validation (Argentine bank account)
financialValidators.cbu();

// IBAN validation
financialValidators.iban();

// Amount with constraints
financialValidators.amount({
  min: 0.01,
  max: 1000000,
  decimals: 2,
});

// Credit card validation (Luhn algorithm)
financialValidators.creditCard();
```

### Common Validators

```typescript
import { commonValidators } from "@/lib/validators";

// Required field
commonValidators.required("email");

// Enum validation
commonValidators.enum(["pending", "completed", "failed"], "status");

// Range validation
commonValidators.range(1, 100, "rating");

// Pattern validation
commonValidators.pattern(/^\d{3}-\d{4}$/, "Invalid format", "phone");

// Custom validation
commonValidators.custom(
  (value) => value.length > 0,
  "Value cannot be empty",
  "name",
);
```

## Error Handling

### ValidationResult Structure

```typescript
interface ValidationError {
  field: string;
  message: string;
  code:
    | "REQUIRED"
    | "INVALID_FORMAT"
    | "TOO_SHORT"
    | "TOO_LONG"
    | "OUT_OF_RANGE"
    | "INVALID_TYPE"
    | "ALREADY_EXISTS"
    | "CUSTOM";
  constraint?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

type ValidationResult<T = void> =
  | { success: true; value?: T }
  | { success: false; error: ValidationError };
```

### SchemaValidationResult

```typescript
const result = await validateSchema(data, schema);

// Check if validation passed
if (!result.hasErrors) {
  // Process data
}

// Get detailed errors
result.errors.forEach((error) => {
  console.log(`${error.field}: ${error.message}`);
});

// Get first error
const firstError = result.getError("email");

// Get all errors for a field
const emailErrors = result.getErrors("email");

// Get grouped messages
const messagesByField = result.getMessagesByField();
// {
//   email: ['Invalid email'],
//   password: ['Too short', 'Must contain uppercase']
// }

// Get as simple object (for form errors)
const formErrors = getValidationErrorsAsObject(result);
// {
//   email: 'Invalid email',
//   password: 'Too short'
// }
```

## Building Custom Validators

### Simple Validator

```typescript
import {
  validationSuccess,
  validationError,
  Validator,
} from "@/lib/validators";

const customValidator: Validator<string> = (value: string) => {
  if (!value.startsWith("PREFIX_")) {
    return validationError("code", "Must start with PREFIX_", "INVALID_FORMAT");
  }

  return validationSuccess();
};
```

### Reusable Validator Factory

```typescript
function codeValidator(prefix: string): Validator<string> {
  return (value: string) => {
    if (!value.startsWith(prefix)) {
      return validationError(
        "code",
        `Must start with ${prefix}`,
        "INVALID_FORMAT",
      );
    }

    return validationSuccess();
  };
}

// Use
const accountCodeValidator = codeValidator("ACC_");
```

### With Async Validation

```typescript
async function validateUniqueEmail(email: string): Promise<ValidationResult> {
  try {
    const exists = await db.users.findUnique({ where: { email } });

    if (exists) {
      return validationError("email", "Email already in use", "ALREADY_EXISTS");
    }

    return validationSuccess();
  } catch {
    return validationError(
      "email",
      "Could not verify email uniqueness",
      "CUSTOM",
    );
  }
}

// Usage (in async context)
const result = await validateUniqueEmail("user@example.com");
```

## Integration with Result Pattern

```typescript
import {
  ok,
  err,
  validationError as resultValidationError,
} from "@/lib/result";
import { validateSchema } from "@/lib/validators";

export async function createTransaction(
  data: TransactionInput,
): Promise<Result<Transaction, AppError>> {
  // Validate input
  const validationResult = await validateSchema(data, transactionSchema);

  if (validationResult.hasErrors) {
    return err(
      resultValidationError(
        "form",
        validationResult.getFirstMessage() || "Invalid transaction data",
      ),
    );
  }

  // Proceed with business logic
  try {
    const tx = await db.transactions.create({ ...data });
    return ok(tx);
  } catch (error) {
    return err(databaseError("insert", "Failed to create transaction"));
  }
}
```

## Best Practices

### 1. Separate Validation Concerns

```typescript
// ❌ Bad: Mixing validation logic
export async function createUser(email: string, password: string) {
  if (!email.includes("@")) throw new Error("Invalid email");
  if (password.length < 8) throw new Error("Weak password");
  // ...
}

// ✅ Good: Dedicated validators
const emailValidator = stringValidators.email();
const passwordValidator = passwordValidators.strong();

export async function createUser(email: string, password: string) {
  const emailResult = emailValidator(email);
  const passwordResult = passwordValidator(password);

  if (!emailResult.success) throw emailResult.error;
  if (!passwordResult.success) throw passwordResult.error;
  // ...
}
```

### 2. Type-Safe Schemas

```typescript
// ✅ Good: Schema types match data types
interface FormData {
  email: string;
  amount: number;
  accountType: "checking" | "savings";
}

const formSchema: Schema<FormData> = {
  email: stringValidators.email(),
  amount: financialValidators.amount({ min: 0 }),
  accountType: commonValidators.enum(["checking", "savings"], "accountType"),
};
```

### 3. Meaningful Error Messages

```typescript
// ❌ Bad: Generic messages
createValidator("password").minLength(8).build();
// "Validation failed"

// ✅ Good: Context-specific messages
createValidator<string>("password")
  .minLength(8, "Your password must be at least 8 characters long")
  .strongPassword("Password must include numbers and special characters")
  .build();
```

### 4. Compose Validators for Reusability

```typescript
// Create base validators
const baseEmailValidator = stringValidators.email();
const basePasswordValidator = passwordValidators.strong();

// Compose for specific use cases
const registrationSchema: Schema<RegisterForm> = {
  email: baseEmailValidator,
  password: basePasswordValidator,
  confirm: basePasswordValidator,
};

const loginSchema: Schema<LoginForm> = {
  email: baseEmailValidator,
  password: stringValidators.text({ min: 1 }), // Less strict for login
};
```

### 5. Validate Early and Often

```typescript
// ✅ Validate on input change for immediate feedback
const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const result = emailValidator(e.target.value);
  setEmailError(result.success ? "" : result.error.message);
};

// ✅ Validate on form submit for final check
const handleSubmit = async (e: React.FormEvent) => {
  const result = await validateSchema(formData, schema);
  if (result.hasErrors) {
    setFormErrors(getValidationErrorsAsObject(result));
    return;
  }
  // Submit form
};
```

## Testing Validators

```typescript
import { stringValidators } from "@/lib/validators";

describe("Email Validator", () => {
  it("should accept valid emails", () => {
    const validator = stringValidators.email();

    const result = validator("user@example.com");
    expect(result.success).toBe(true);
  });

  it("should reject invalid emails", () => {
    const validator = stringValidators.email();

    const result = validator("invalid-email");
    expect(result.success).toBe(false);
    expect(result.error.code).toBe("INVALID_FORMAT");
  });

  it("should reject empty emails", () => {
    const validator = stringValidators.email();

    const result = validator("");
    expect(result.success).toBe(false);
    expect(result.error.code).toBe("REQUIRED");
  });
});
```

## Migration Guide

### From Manual Validation

```typescript
// Before
function validateAmount(amount: unknown): boolean {
  return typeof amount === "number" && amount > 0 && amount < 1000000;
}

if (!validateAmount(userAmount)) {
  showError("Invalid amount");
}

// After
const amountValidator = financialValidators.amount({
  min: 0.01,
  max: 999999.99,
});

const result = amountValidator(userAmount);
if (!result.success) {
  showError(result.error.message);
}
```

## Extending Validators

```typescript
// Add custom validator for your domain
import {
  Validator,
  validationSuccess,
  validationError,
} from "@/lib/validators";

export const customValidators = {
  /**
   * Validate Argentine ID (DNI, Cédula)
   */
  dni: (): Validator<string> => {
    return (value: string) => {
      const sanitized = value.replace(/\D/g, "");

      if (sanitized.length !== 8) {
        return validationError(
          "dni",
          "DNI must contain 8 digits",
          "INVALID_FORMAT",
        );
      }

      return validationSuccess();
    };
  },

  /**
   * Validate CUIT (Argentine tax ID)
   */
  cuit: (): Validator<string> => {
    return (value: string) => {
      const sanitized = value.replace(/\D/g, "");

      if (sanitized.length !== 11) {
        return validationError(
          "cuit",
          "CUIT must contain 11 digits",
          "INVALID_FORMAT",
        );
      }

      return validationSuccess();
    };
  },
};
```
