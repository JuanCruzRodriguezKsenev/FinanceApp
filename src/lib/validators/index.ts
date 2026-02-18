/**
 * Validators Library - Main Export Index
 *
 * Provides a comprehensive validation framework with:
 * - Type-safe validators
 * - Fluent builder API
 * - Common field validators
 * - Schema validation
 * - Error handling
 */

export * from "./types";
export * from "./fields";
export * from "./builder";
export * from "./schema";

/**
 * Convenience presets for common validation scenarios
 */
export const validatorPresets = {
  /**
   * User account creation
   */
  userRegistration: () => ({
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      required: true,
      minLength: 8,
      // Should contain uppercase, lowercase, number
    },
    passwordConfirm: {
      required: true,
      matches: "password",
    },
  }),

  /**
   * Bank account creation
   */
  bankAccount: () => ({
    bankName: {
      required: true,
      minLength: 2,
    },
    accountNumber: {
      required: true,
    },
    accountType: {
      required: true,
      enum: ["checking", "savings", "money_market"],
    },
    cbu: {
      required: true,
      pattern: /^\d{22}$/,
    },
  }),

  /**
   * Transaction creation
   */
  transaction: () => ({
    amount: {
      required: true,
      type: "number",
      min: 0.01,
      max: 10000000,
    },
    description: {
      required: true,
      minLength: 3,
      maxLength: 500,
    },
    fromAccount: {
      required: true,
    },
    toAccount: {
      required: true,
    },
  }),

  /**
   * Contact creation
   */
  contact: () => ({
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      // Optional
    },
    phoneNumber: {
      // Optional
    },
    cbuOrAlias: {
      required: true,
    },
  }),
};
