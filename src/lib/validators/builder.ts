/**
 * Validator Builder - Fluent API for composing validators
 */

import {
  validationError,
  ValidationResult,
  validationSuccess,
  Validator,
  ValidatorBuilder,
} from "./types";

/**
 * Create a fluent validator builder
 *
 * Usage:
 * ```typescript
 * const emailValidator = createValidatorBuilder<string>('email')
 *   .required('Email is mandatory')
 *   .email('Invalid email format')
 *   .build();
 * ```
 */
export class FluentValidatorBuilder<T> implements ValidatorBuilder<T> {
  private field: string;
  private validations: Array<(value: T) => ValidationResult> = [];

  constructor(field: string = "") {
    this.field = field;
  }

  required(message?: string): FluentValidatorBuilder<T> {
    this.validations.push((value: T) => {
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "string" && value.trim().length === 0)
      ) {
        return validationError(
          this.field,
          message || "This field is required",
          "REQUIRED",
        );
      }
      return validationSuccess();
    });

    return this;
  }

  minLength(length: number, message?: string): FluentValidatorBuilder<T> {
    this.validations.push((value: T) => {
      if (typeof value === "string" && value.length < length) {
        return validationError(
          this.field,
          message || `Minimum ${length} characters required`,
          "TOO_SHORT",
          { min: length },
        );
      }
      return validationSuccess();
    });

    return this;
  }

  maxLength(length: number, message?: string): FluentValidatorBuilder<T> {
    this.validations.push((value: T) => {
      if (typeof value === "string" && value.length > length) {
        return validationError(
          this.field,
          message || `Maximum ${length} characters allowed`,
          "TOO_LONG",
          { max: length },
        );
      }
      return validationSuccess();
    });

    return this;
  }

  pattern(regex: RegExp, message?: string): FluentValidatorBuilder<T> {
    this.validations.push((value: T) => {
      if (typeof value === "string" && !regex.test(value)) {
        return validationError(
          this.field,
          message || "Invalid format",
          "INVALID_FORMAT",
          { pattern: regex.source },
        );
      }
      return validationSuccess();
    });

    return this;
  }

  min(value: number, message?: string): FluentValidatorBuilder<T> {
    this.validations.push((val: T) => {
      if (typeof val === "number" && val < value) {
        return validationError(
          this.field,
          message || `Minimum value is ${value}`,
          "OUT_OF_RANGE",
          { min: value },
        );
      }
      return validationSuccess();
    });

    return this;
  }

  max(value: number, message?: string): FluentValidatorBuilder<T> {
    this.validations.push((val: T) => {
      if (typeof val === "number" && val > value) {
        return validationError(
          this.field,
          message || `Maximum value is ${value}`,
          "OUT_OF_RANGE",
          { max: value },
        );
      }
      return validationSuccess();
    });

    return this;
  }

  custom(
    fn: (value: T) => boolean | string,
    message?: string,
  ): FluentValidatorBuilder<T> {
    this.validations.push((value: T) => {
      const result = fn(value);

      if (result === false) {
        return validationError(
          this.field,
          message || "Validation failed",
          "CUSTOM",
        );
      }

      if (typeof result === "string") {
        return validationError(this.field, result, "CUSTOM");
      }

      return validationSuccess();
    });

    return this;
  }

  email(message?: string): FluentValidatorBuilder<T> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return this.pattern(emailRegex, message || "Please enter a valid email");
  }

  url(message?: string): FluentValidatorBuilder<T> {
    return this.custom((value: T) => {
      if (typeof value !== "string") return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, message || "Please enter a valid URL");
  }

  phoneNumber(message?: string): FluentValidatorBuilder<T> {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

    return this.pattern(
      phoneRegex,
      message || "Please enter a valid phone number",
    );
  }

  creditCard(message?: string): FluentValidatorBuilder<T> {
    return this.custom((value: T) => {
      if (typeof value !== "string") return true;

      const sanitized = value.replace(/\D/g, "");

      if (sanitized.length < 13 || sanitized.length > 19) return false;

      // Luhn algorithm
      let sum = 0;
      let isEven = false;

      for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized[i], 10);

        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
      }

      return sum % 10 === 0;
    }, message || "Invalid card number");
  }

  cbu(message?: string): FluentValidatorBuilder<T> {
    const cbuRegex = /^\d{22}$/;

    return this.pattern(cbuRegex, message || "CBU must contain 22 digits");
  }

  strongPassword(message?: string): FluentValidatorBuilder<T> {
    return this.custom((value: T) => {
      if (typeof value !== "string") return true;

      if (value.length < 8) return false;

      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

      return hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }, message || "Password must contain uppercase, lowercase, number, and special character");
  }

  matches(fieldName: string, message?: string): FluentValidatorBuilder<T> {
    // This is a placeholder - actual implementation would need to be async
    // to compare against another field's value
    return this;
  }

  unique(
    asyncValidator: (value: T) => Promise<boolean>,
    message?: string,
  ): FluentValidatorBuilder<T> {
    // Async validation would need to be handled differently
    // This is a placeholder for the interface compatibility
    return this;
  }

  build(): Validator<T> {
    return (value: T): ValidationResult => {
      for (const validation of this.validations) {
        const result = validation(value);
        if (!result.success) {
          return result;
        }
      }

      return validationSuccess();
    };
  }
}

/**
 * Create a new fluent validator builder
 */
export function createValidator<T>(
  fieldName: string = "",
): FluentValidatorBuilder<T> {
  return new FluentValidatorBuilder<T>(fieldName);
}
