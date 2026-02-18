/**
 * Validation Types and Interfaces
 *
 * Defines the validation framework used across the application
 * for type-safe, reusable validation logic.
 */

/**
 * Result of a validation attempt
 */
export type ValidationResult<T = void> =
  | { success: true; value?: T }
  | { success: false; error: ValidationError };

/**
 * Structured validation error
 */
export interface ValidationError {
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
    [key: string]: any;
  };
}

/**
 * Validator function type
 */
export type Validator<T> = (value: T) => ValidationResult;

/**
 * Validation rule for a field
 */
export interface ValidationRule<T> {
  field: string;
  validate: (value: T) => ValidationResult;
}

/**
 * Schema validator for multiple fields
 */
export type Schema<T> = {
  [K in keyof T]: Validator<T[K]>;
};

/**
 * Validation error collection
 */
export interface ValidationErrorCollection {
  errors: ValidationError[];
  hasErrors: boolean;
  getError(field: string): ValidationError | undefined;
  getErrors(field: string): ValidationError[];
}

/**
 * Validator builder for fluent API
 */
export interface ValidatorBuilder<T> {
  required(message?: string): ValidatorBuilder<T>;
  minLength(length: number, message?: string): ValidatorBuilder<T>;
  maxLength(length: number, message?: string): ValidatorBuilder<T>;
  pattern(regex: RegExp, message?: string): ValidatorBuilder<T>;
  min(value: number, message?: string): ValidatorBuilder<T>;
  max(value: number, message?: string): ValidatorBuilder<T>;
  custom(
    fn: (value: T) => boolean | string,
    message?: string,
  ): ValidatorBuilder<T>;
  email(message?: string): ValidatorBuilder<T>;
  url(message?: string): ValidatorBuilder<T>;
  phoneNumber(message?: string): ValidatorBuilder<T>;
  creditCard(message?: string): ValidatorBuilder<T>;
  cbu(message?: string): ValidatorBuilder<T>;
  strongPassword(message?: string): ValidatorBuilder<T>;
  matches(fieldName: string, message?: string): ValidatorBuilder<T>;
  unique(
    asyncValidator: (value: T) => Promise<boolean>,
    message?: string,
  ): ValidatorBuilder<T>;
  build(): Validator<T>;
}

/**
 * Success validation result factory
 */
export const validationSuccess = <T = void>(
  value?: T,
): ValidationResult<T> => ({
  success: true,
  value,
});

/**
 * Error validation result factory
 */
export const validationError = (
  field: string,
  message: string,
  code: ValidationError["code"] = "CUSTOM",
  constraint?: ValidationError["constraint"],
): ValidationResult => ({
  success: false,
  error: { field, message, code, constraint },
});
