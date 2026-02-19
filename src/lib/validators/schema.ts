/**
 * Schema Validation - Validate entire objects
 */

import {
  Schema,
  ValidationErrorCollection,
  ValidationResult,
  validationSuccess,
} from "./types";

/**
 * Validation result for a complete schema
 */
export class SchemaValidationResult implements ValidationErrorCollection {
  errors: import("./types").ValidationError[] = [];

  constructor(validationErrors: import("./types").ValidationError[] = []) {
    this.errors = validationErrors;
  }

  get hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getError(field: string): import("./types").ValidationError | undefined {
    return this.errors.find((e) => e.field === field);
  }

  getErrors(field: string): import("./types").ValidationError[] {
    return this.errors.filter((e) => e.field === field);
  }

  /**
   * Get first error message, or undefined if no errors
   */
  getFirstMessage(): string | undefined {
    return this.errors[0]?.message;
  }

  /**
   * Get all error messages
   */
  getMessages(): string[] {
    return this.errors.map((e) => e.message);
  }

  /**
   * Get messages grouped by field
   */
  getMessagesByField(): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    for (const error of this.errors) {
      if (!grouped[error.field]) {
        grouped[error.field] = [];
      }
      grouped[error.field].push(error.message);
    }

    return grouped;
  }
}

/**
 * Validate an entire object against a schema
 *
 * Usage:
 * ```typescript
 * const userSchema: Schema<User> = {
 *   email: stringValidators.email(),
 *   password: passwordValidators.strong(),
 *   age: commonValidators.range(18, 120, 'age'),
 * };
 *
 * const result = validateSchema(user, userSchema);
 * if (!result.hasErrors) {
 *   // Process user
 * }
 * ```
 */
export async function validateSchema<T extends Record<string, any>>(
  data: T,
  schema: Schema<T>,
): Promise<SchemaValidationResult> {
  const errors: import("./types").ValidationError[] = [];

  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field as keyof T];
    const result = (validator as any)(value);

    if (!result.success) {
      errors.push({
        ...result.error,
        field: result.error.field || (field as string),
      });
    }
  }

  return new SchemaValidationResult(errors);
}

/**
 * Validate a partial schema (only specified fields)
 */
export async function validatePartialSchema<T extends Record<string, any>>(
  data: Partial<T>,
  schema: Partial<Schema<T>>,
): Promise<SchemaValidationResult> {
  const errors: import("./types").ValidationError[] = [];

  for (const [field, validator] of Object.entries(schema)) {
    if (field in data) {
      const value = data[field as keyof T];
      const result = (validator as any)(value);

      if (!result.success) {
        errors.push({
          ...result.error,
          field: result.error.field || (field as string),
        });
      }
    }
  }

  return new SchemaValidationResult(errors);
}

/**
 * Get first validation error or undefined
 */
export function getFirstValidationError(
  result: SchemaValidationResult,
): import("./types").ValidationError | undefined {
  return result.errors[0];
}

/**
 * Transform validation errors to a simple object format
 * Useful for form error handling
 */
export function getValidationErrorsAsObject(
  result: SchemaValidationResult,
): Record<string, string> {
  const obj: Record<string, string> = {};

  for (const error of result.errors) {
    obj[error.field] = error.message;
  }

  return obj;
}
