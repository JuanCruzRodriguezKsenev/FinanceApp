/**
 * Common Field Validators
 *
 * Reusable validation functions for common fields across the application
 */

import {
  ValidationResult,
  validationSuccess,
  validationError,
  Validator,
} from "./types";

/**
 * String validators
 */
export const stringValidators = {
  /**
   * Validate that a string is not empty and has valid length
   */
  text: (options?: { min?: number; max?: number }): Validator<string> => {
    return (value: string) => {
      if (!value || value.trim().length === 0) {
        return validationError("", "This field is required", "REQUIRED");
      }

      const trimmed = value.trim();

      if (options?.min && trimmed.length < options.min) {
        return validationError(
          "",
          `Must be at least ${options.min} characters`,
          "TOO_SHORT",
          { min: options.min },
        );
      }

      if (options?.max && trimmed.length > options.max) {
        return validationError(
          "",
          `Must not exceed ${options.max} characters`,
          "TOO_LONG",
          { max: options.max },
        );
      }

      return validationSuccess();
    };
  },

  /**
   * Validate email format
   */
  email: (): Validator<string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return (value: string) => {
      if (!value) {
        return validationError("", "Email is required", "REQUIRED");
      }

      if (!emailRegex.test(value)) {
        return validationError(
          "",
          "Please enter a valid email",
          "INVALID_FORMAT",
          {
            pattern: "user@domain.com",
          },
        );
      }

      return validationSuccess();
    };
  },

  /**
   * Validate URL format
   */
  url: (): Validator<string> => {
    return (value: string) => {
      if (!value) {
        return validationError("", "URL is required", "REQUIRED");
      }

      try {
        new URL(value);
        return validationSuccess();
      } catch {
        return validationError(
          "",
          "Please enter a valid URL",
          "INVALID_FORMAT",
        );
      }
    };
  },

  /**
   * Validate phone number (basic format)
   */
  phoneNumber: (): Validator<string> => {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

    return (value: string) => {
      if (!value) {
        return validationError("", "Phone number is required", "REQUIRED");
      }

      if (!phoneRegex.test(value.replace(/\s/g, ""))) {
        return validationError(
          "",
          "Please enter a valid phone number",
          "INVALID_FORMAT",
        );
      }

      return validationSuccess();
    };
  },
};

/**
 * Password validators
 */
export const passwordValidators = {
  /**
   * Validate password strength
   * Must contain: uppercase, lowercase, number, special char, min 8 chars
   */
  strong: (): Validator<string> => {
    return (value: string) => {
      if (!value) {
        return validationError("", "Password is required", "REQUIRED");
      }

      if (value.length < 8) {
        return validationError(
          "",
          "Password must be at least 8 characters",
          "TOO_SHORT",
          { min: 8 },
        );
      }

      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        return validationError(
          "",
          "Password must contain uppercase, lowercase, number, and special character",
          "INVALID_FORMAT",
        );
      }

      return validationSuccess();
    };
  },

  /**
   * Basic password validation - just non-empty
   */
  basic: (): Validator<string> => {
    return (value: string) => {
      if (!value || value.length < 6) {
        return validationError(
          "",
          "Password must be at least 6 characters",
          "TOO_SHORT",
          { min: 6 },
        );
      }

      return validationSuccess();
    };
  },
};

/**
 * Financial validators
 */
export const financialValidators = {
  /**
   * Validate CBU (Código Bancario Uniforme) - Argentine bank account
   * 22 digits, specific format
   */
  cbu: (): Validator<string> => {
    return (value: string) => {
      if (!value) {
        return validationError("", "CBU is required", "REQUIRED");
      }

      const cbuRegex = /^\d{22}$/;

      if (!cbuRegex.test(value)) {
        return validationError(
          "",
          "CBU must contain 22 digits",
          "INVALID_FORMAT",
          { pattern: "12-digit-bank | 14-digit-account" },
        );
      }

      // Validate checksum (simplified)
      return validationSuccess();
    };
  },

  /**
   * Validate IBAN (International Bank Account Number)
   */
  iban: (): Validator<string> => {
    return (value: string) => {
      if (!value) {
        return validationError("", "IBAN is required", "REQUIRED");
      }

      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;

      if (!ibanRegex.test(value)) {
        return validationError(
          "",
          "Please enter a valid IBAN",
          "INVALID_FORMAT",
        );
      }

      return validationSuccess();
    };
  },

  /**
   * Validate amount (currency)
   */
  amount: (options?: {
    min?: number;
    max?: number;
    decimals?: number;
  }): Validator<number> => {
    return (value: number) => {
      if (value === null || value === undefined) {
        return validationError("", "Amount is required", "REQUIRED");
      }

      if (isNaN(value) || value < 0) {
        return validationError(
          "",
          "Amount must be a positive number",
          "INVALID_TYPE",
        );
      }

      if (options?.min !== undefined && value < options.min) {
        return validationError(
          "",
          `Minimum amount is ${options.min}`,
          "OUT_OF_RANGE",
          { min: options.min },
        );
      }

      if (options?.max !== undefined && value > options.max) {
        return validationError(
          "",
          `Maximum amount is ${options.max}`,
          "OUT_OF_RANGE",
          { max: options.max },
        );
      }

      if (options?.decimals !== undefined) {
        const decimalPlaces = (value.toString().split(".")[1] || "").length;
        if (decimalPlaces > options.decimals) {
          return validationError(
            "",
            `Maximum ${options.decimals} decimal places allowed`,
            "INVALID_FORMAT",
          );
        }
      }

      return validationSuccess();
    };
  },

  /**
   * Validate credit card number (Luhn algorithm)
   */
  creditCard: (): Validator<string> => {
    return (value: string) => {
      if (!value) {
        return validationError("", "Card number is required", "REQUIRED");
      }

      const sanitized = value.replace(/\D/g, "");

      if (sanitized.length < 13 || sanitized.length > 19) {
        return validationError(
          "",
          "Card number must be between 13-19 digits",
          "INVALID_FORMAT",
        );
      }

      // Luhn algorithm
      let sum = 0;
      let isEven = false;

      for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized[i], 10);

        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        isEven = !isEven;
      }

      if (sum % 10 !== 0) {
        return validationError("", "Invalid card number", "INVALID_FORMAT");
      }

      return validationSuccess();
    };
  },
};

/**
 * Common validators
 */
export const commonValidators = {
  /**
   * Validate that a value is not empty
   */
  required: (fieldName: string = ""): Validator<any> => {
    return (value: any) => {
      if (value === null || value === undefined || value === "") {
        return validationError(
          fieldName,
          `${fieldName || "This field"} is required`,
          "REQUIRED",
        );
      }

      return validationSuccess();
    };
  },

  /**
   * Validate that value matches an enum
   */
  enum: <T>(validValues: T[], fieldName: string = ""): Validator<T> => {
    return (value: T) => {
      if (!validValues.includes(value)) {
        return validationError(
          fieldName,
          `Must be one of: ${validValues.join(", ")}`,
          "INVALID_FORMAT",
        );
      }

      return validationSuccess();
    };
  },

  /**
   * Validate that value is in a range
   */
  range: (
    min: number,
    max: number,
    fieldName: string = "",
  ): Validator<number> => {
    return (value: number) => {
      if (value < min || value > max) {
        return validationError(
          fieldName,
          `Must be between ${min} and ${max}`,
          "OUT_OF_RANGE",
          { min, max },
        );
      }

      return validationSuccess();
    };
  },

  /**
   * Validate using a regex pattern
   */
  pattern: (
    regex: RegExp,
    message: string,
    fieldName: string = "",
  ): Validator<string> => {
    return (value: string) => {
      if (!regex.test(value)) {
        return validationError(fieldName, message, "INVALID_FORMAT");
      }

      return validationSuccess();
    };
  },

  /**
   * Validate using a custom function
   */
  custom: (
    fn: (value: any) => boolean,
    message: string,
    fieldName: string = "",
  ): Validator<any> => {
    return (value: any) => {
      if (!fn(value)) {
        return validationError(fieldName, message, "CUSTOM");
      }

      return validationSuccess();
    };
  },
};
