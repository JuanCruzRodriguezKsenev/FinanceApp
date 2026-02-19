import { describe, expect, it } from "vitest";

import {
  financialValidators,
  passwordValidators,
  stringValidators,
} from "@/lib/validators";

const expectError = (
  result: { success: boolean; error?: { code: string } },
  code: string,
) => {
  expect(result.success).toBe(false);
  expect(result.error?.code).toBe(code);
};

describe("validators", () => {
  describe("stringValidators.email", () => {
    const validate = stringValidators.email();

    it("accepts a valid email", () => {
      const result = validate("user@example.com");
      expect(result.success).toBe(true);
    });

    it("rejects empty string", () => {
      const result = validate("");
      expectError(result, "REQUIRED");
    });

    it("rejects missing @", () => {
      const result = validate("userexample.com");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects missing domain", () => {
      const result = validate("user@");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects missing TLD", () => {
      const result = validate("user@example");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects multiple @ symbols", () => {
      const result = validate("user@@example.com");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects spaces", () => {
      const result = validate("user @example.com");
      expectError(result, "INVALID_FORMAT");
    });

    it("accepts uppercase emails", () => {
      const result = validate("USER@EXAMPLE.COM");
      expect(result.success).toBe(true);
    });
  });

  describe("passwordValidators.strong", () => {
    const validate = passwordValidators.strong();

    it("rejects empty password", () => {
      const result = validate("");
      expectError(result, "REQUIRED");
    });

    it("rejects passwords shorter than 8", () => {
      const result = validate("Ab1!");
      expectError(result, "TOO_SHORT");
    });

    it("rejects missing uppercase", () => {
      const result = validate("abc123!@");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects missing lowercase", () => {
      const result = validate("ABC123!@");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects missing number", () => {
      const result = validate("Abcdef!@");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects missing special character", () => {
      const result = validate("Abcdef12");
      expectError(result, "INVALID_FORMAT");
    });

    it("accepts a valid strong password", () => {
      const result = validate("Abcd1234!");
      expect(result.success).toBe(true);
    });

    it("accepts another valid strong password", () => {
      const result = validate("Z9x#Y7w$");
      expect(result.success).toBe(true);
    });
  });

  describe("financialValidators.amount", () => {
    it("rejects null values", () => {
      const validate = financialValidators.amount();
      const result = validate(null as unknown as number);
      expectError(result, "REQUIRED");
    });

    it("rejects undefined values", () => {
      const validate = financialValidators.amount();
      const result = validate(undefined as unknown as number);
      expectError(result, "REQUIRED");
    });

    it("rejects NaN", () => {
      const validate = financialValidators.amount();
      const result = validate(Number.NaN);
      expectError(result, "INVALID_TYPE");
    });

    it("rejects negative numbers", () => {
      const validate = financialValidators.amount();
      const result = validate(-10);
      expectError(result, "INVALID_TYPE");
    });

    it("enforces minimum", () => {
      const validate = financialValidators.amount({ min: 10 });
      const result = validate(5);
      expectError(result, "OUT_OF_RANGE");
    });

    it("enforces maximum", () => {
      const validate = financialValidators.amount({ max: 100 });
      const result = validate(150);
      expectError(result, "OUT_OF_RANGE");
    });

    it("rejects too many decimals", () => {
      const validate = financialValidators.amount({ decimals: 2 });
      const result = validate(10.123);
      expectError(result, "INVALID_FORMAT");
    });

    it("accepts exact decimal limit", () => {
      const validate = financialValidators.amount({ decimals: 2 });
      const result = validate(10.12);
      expect(result.success).toBe(true);
    });

    it("accepts integer amounts", () => {
      const validate = financialValidators.amount();
      const result = validate(25);
      expect(result.success).toBe(true);
    });

    it("accepts valid amounts within range", () => {
      const validate = financialValidators.amount({ min: 1, max: 1000 });
      const result = validate(250);
      expect(result.success).toBe(true);
    });
  });

  describe("financialValidators.cbu", () => {
    const validate = financialValidators.cbu();

    it("rejects empty", () => {
      const result = validate("");
      expectError(result, "REQUIRED");
    });

    it("rejects non-digit characters", () => {
      const result = validate("1234abcd90123456789012");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects too short values", () => {
      const result = validate("123456789012345678901");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects too long values", () => {
      const result = validate("123456789012345678901234");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects values with spaces", () => {
      const result = validate("1234 567890123456789012");
      expectError(result, "INVALID_FORMAT");
    });

    it("accepts a 22-digit number", () => {
      const result = validate("1234567890123456789012");
      expect(result.success).toBe(true);
    });

    it("accepts another valid 22-digit number", () => {
      const result = validate("0000000000000000000000");
      expect(result.success).toBe(true);
    });

    it("rejects mixed separators", () => {
      const result = validate("1234-5678-9012-3456-7890-12");
      expectError(result, "INVALID_FORMAT");
    });
  });

  describe("financialValidators.iban", () => {
    const validate = financialValidators.iban();

    it("rejects empty", () => {
      const result = validate("");
      expectError(result, "REQUIRED");
    });

    it("rejects lowercase country code", () => {
      const result = validate("gb82WEST12345698765432");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects missing country code", () => {
      const result = validate("82WEST12345698765432");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects invalid characters", () => {
      const result = validate("GB82WEST1234569876543$");
      expectError(result, "INVALID_FORMAT");
    });

    it("rejects too short strings", () => {
      const result = validate("GB1");
      expectError(result, "INVALID_FORMAT");
    });

    it("accepts a valid IBAN", () => {
      const result = validate("GB82WEST12345698765432");
      expect(result.success).toBe(true);
    });

    it("accepts another valid IBAN", () => {
      const result = validate("DE89370400440532013000");
      expect(result.success).toBe(true);
    });

    it("rejects spaces in IBAN", () => {
      const result = validate("GB82 WEST 12345698765432");
      expectError(result, "INVALID_FORMAT");
    });
  });
});
