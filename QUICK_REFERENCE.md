# 🚀 Quick Reference - Infrastructure Guidelines

## Error Handling Pattern

```typescript
import {
  ok,
  err,
  databaseError,
  networkError,
  validationError,
} from "@/lib/result";

export async function myAction(data: Input): Promise<Result<Output, AppError>> {
  try {
    // Validate
    if (!data.amount || data.amount <= 0) {
      return err(validationError("amount", "Must be greater than 0"));
    }

    // Execute
    const result = await db.operation();
    return ok(result);
  } catch (error) {
    return err(databaseError("select", "Query failed"));
  }
}

// In components
const result = await myAction(data);
if (result.isOk()) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

## Validation Pattern

```typescript
import {
  validateSchema,
  createValidator,
  stringValidators,
} from "@/lib/validators";

// Single field
const emailValidator = stringValidators.email();
const result = emailValidator("user@example.com");

// Fluent builder
const passwordValidator = createValidator<string>()
  .required()
  .minLength(8)
  .strongPassword()
  .build();

// Schema
const schema: Schema<SignUp> = {
  email: stringValidators.email(),
  password: passwordValidators.strong(),
  amount: financialValidators.amount({ min: 100, max: 100000 }),
};

const validation = await validateSchema(formData, schema);
if (!validation.hasErrors) {
  // Process
}
```

## Circuit Breaker Pattern

```typescript
import { CircuitBreakerFactory } from '@/lib/circuit-breaker';

// Create
const breaker = CircuitBreakerFactory.database('my-db');

// Use
try {
  await breaker.execute(() => db.query(...));
} catch (error) {
  if (error instanceof CircuitBreakerOpenError) {
    // Service is down
  }
}

// Monitor
const status = breaker.getMetrics();
```

## Server Action Template

```typescript
"use server";

import { validateSchema } from "@/lib/validators";
import { ok, err, validationError, databaseError } from "@/lib/result";
import { CircuitBreakerFactory } from "@/lib/circuit-breaker";

const mySchema = {
  /* ... */
};
const breaker = CircuitBreakerFactory.database("my-db");

export async function myServerAction(
  input: Input,
): Promise<Result<Output, AppError>> {
  // 1. Validate
  const validation = await validateSchema(input, mySchema);
  if (validation.hasErrors) {
    return err(validationError("form", validation.getFirstMessage()));
  }

  // 2. Protect
  try {
    const result = await breaker.execute(() => db.operation(input));
    return ok(result);
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      return err(networkError("Service temporarily unavailable"));
    }
    return err(databaseError("insert", "Operation failed"));
  }
}
```

## React Component Template

```typescript
'use client';

import { useState } from 'react';
import { stringValidators, passwordValidators } from '@/lib/validators';
import type { ValidationError } from '@/lib/validators';

const emailValidator = stringValidators.email();
const passwordValidator = passwordValidators.strong();

export function MyForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate
    const validator = name === 'email' ? emailValidator : passwordValidator;
    const result = validator(value);

    setErrors(prev => ({
      ...prev,
      [name]: result.success ? '' : result.error.message,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Call server action
    const result = await myServerAction(formData);

    if (!result.isOk()) {
      setErrors({ form: result.error.message });
    } else {
      console.log('Success!', result.value);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" onChange={handleChange} />
      {errors.email && <span className="error">{errors.email}</span>}
      {/* ... */}
    </form>
  );
}
```

## Type Definitions

```typescript
// Error handling
type Result<T, E = AppError> = Ok<T> | Err<E>;

// Validation
type ValidationResult<T = void> =
  | { success: true; value?: T }
  | { success: false; error: ValidationError };

// Circuit breaker
type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";
```

## Common Validators Reference

```typescript
// Strings
stringValidators.email();
stringValidators.url();
stringValidators.phoneNumber();
stringValidators.text({ min: 3, max: 100 });

// Passwords
passwordValidators.strong(); // 8+ chars, uppercase, lowercase, number, special
passwordValidators.basic(); // 6+ chars

// Financial
financialValidators.cbu(); // 22 digits
financialValidators.iban();
financialValidators.amount({ min, max, decimals });
financialValidators.creditCard();

// Common
commonValidators.required();
commonValidators.enum(["a", "b", "c"]);
commonValidators.range(min, max);
commonValidators.pattern(/regex/);
commonValidators.custom(fn);
```

## Error Codes

```typescript
"REQUIRED"; // Value is missing
"INVALID_FORMAT"; // Format is wrong
"TOO_SHORT"; // Length below minimum
"TOO_LONG"; // Length above maximum
"OUT_OF_RANGE"; // Number outside min/max
"INVALID_TYPE"; // Wrong data type
"ALREADY_EXISTS"; // Value already in database
"CUSTOM"; // Custom validation error
```

## AppError Types

```typescript
validationError(field, message, values?)
databaseError(operation, message)         // 'insert', 'select', 'update', 'delete'
authorizationError(resource)
notFoundError(resource, id)
networkError(message)
```

## Debugging

```typescript
// Circuit breaker metrics
const metrics = breaker.getMetrics();
console.log(metrics.state); // CLOSED | OPEN | HALF_OPEN
console.log(metrics.totalCalls);
console.log(metrics.failedCalls);
console.log(
  (
    ((metrics.totalCalls - metrics.failedCalls) / metrics.totalCalls) *
    100
  ).toFixed(2) + "%",
);

// Validation errors
const result = await validateSchema(data, schema);
console.log(result.getMessagesByField()); // { field: ['message'] }
console.log(result.getValidationErrorsAsObject(result)); // { field: 'message' }

// Logger
import { logger } from "@/lib/logger";
logger.info("Message", { context: "value" });
logger.error("Failure", error, { context: "value" });
```

## Best Practices Checklist

- ✅ Always use `validateSchema` for server action inputs
- ✅ Wrap external calls with CircuitBreaker
- ✅ Return `Result<T, AppError>` not throwing errors
- ✅ Use `.isOk()` / `.isErr()` guards before accessing values
- ✅ Provide context-specific error messages
- ✅ Log errors with logger, not console.\*
- ✅ Handle CircuitBreakerOpenError specially
- ✅ Compose validators with fluent API
- ✅ Use schema validation for objects
- ✅ Never expose internal errors to users

## Migration Checklist

When adding new server action:

```
[ ] Create validation schema using validators
[ ] Use validateSchema at action start
[ ] Return Result<T, AppError>
[ ] Wrap DB/API calls with CircuitBreaker
[ ] Handle CircuitBreakerOpenError case
[ ] Use appropriate error factories
[ ] Test with both success and failure cases
[ ] Update component to handle Result
[ ] Document in JSDoc
```
