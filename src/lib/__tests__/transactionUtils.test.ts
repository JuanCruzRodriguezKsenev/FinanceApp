import { describe, expect, it } from "vitest";
import {
  calculateBalance,
  calculateTotalByType,
  calculateTotals,
  getTransactionStats,
} from "@/lib/transactionUtils";
import type { Transaction } from "@/types";

const makeTx = (overrides: Partial<Transaction>): Transaction =>
  ({
    id: "tx-1",
    userId: "user-1",
    type: "income",
    amount: "0",
    currency: "ARS",
    date: new Date("2026-02-19"),
    description: "Test",
    category: "other",
    state: "CONFIRMED",
    fromBankAccountId: null,
    toBankAccountId: null,
    fromWalletId: null,
    toWalletId: null,
    fromAccountId: null,
    toAccountId: null,
    contactId: null,
    transferLeg: null,
    transferRecipient: null,
    transferSender: null,
    isTransferBetweenOwnAccounts: false,
    isTransferToThirdParty: false,
    isCashWithdrawal: false,
    isCashDeposit: false,
    createdAt: new Date("2026-02-19"),
    updatedAt: new Date("2026-02-19"),
    ...overrides,
  }) as Transaction;

describe("transactionUtils", () => {
  describe("calculateTotalByType", () => {
    it("returns 0 for empty list", () => {
      expect(calculateTotalByType([], "income")).toBe(0);
    });

    it("sums amounts for the matching type", () => {
      const transactions = [
        makeTx({ id: "t1", type: "income", amount: "100" }),
        makeTx({ id: "t2", type: "income", amount: "50" }),
      ];

      expect(calculateTotalByType(transactions, "income")).toBe(150);
    });

    it("ignores transactions with other types", () => {
      const transactions = [
        makeTx({ id: "t1", type: "income", amount: "100" }),
        makeTx({ id: "t2", type: "expense", amount: "999" }),
      ];

      expect(calculateTotalByType(transactions, "income")).toBe(100);
    });

    it("parses decimal amounts", () => {
      const transactions = [
        makeTx({ id: "t1", type: "income", amount: "10.5" }),
        makeTx({ id: "t2", type: "income", amount: "2.25" }),
      ];

      expect(calculateTotalByType(transactions, "income")).toBe(12.75);
    });

    it("treats missing matches as 0", () => {
      const transactions = [
        makeTx({ id: "t1", type: "expense", amount: "100" }),
      ];

      expect(calculateTotalByType(transactions, "income")).toBe(0);
    });

    it("handles mixed numeric strings", () => {
      const transactions = [
        makeTx({ id: "t1", type: "income", amount: "0010" }),
        makeTx({ id: "t2", type: "income", amount: "20" }),
      ];

      expect(calculateTotalByType(transactions, "income")).toBe(30);
    });
  });

  describe("calculateTotals", () => {
    it("returns totals for each requested type", () => {
      const transactions = [
        makeTx({ id: "t1", type: "income", amount: "100" }),
        makeTx({ id: "t2", type: "expense", amount: "40" }),
      ];

      const totals = calculateTotals(transactions, ["income", "expense"]);
      expect(totals.income).toBe(100);
      expect(totals.expense).toBe(40);
    });

    it("returns 0 when a type is missing", () => {
      const transactions = [makeTx({ id: "t1", type: "income", amount: "5" })];

      const totals = calculateTotals(transactions, ["income", "saving"]);
      expect(totals.income).toBe(5);
      expect(totals.saving).toBe(0);
    });

    it("returns an empty object when no types provided", () => {
      const totals = calculateTotals([], []);
      expect(totals).toEqual({});
    });

    it("does not mutate the input list", () => {
      const transactions = [makeTx({ id: "t1", type: "income", amount: "5" })];
      const copy = [...transactions];

      calculateTotals(transactions, ["income"]);
      expect(transactions).toEqual(copy);
    });

    it("supports duplicate types by last write", () => {
      const transactions = [makeTx({ id: "t1", type: "income", amount: "5" })];

      const totals = calculateTotals(transactions, ["income", "income"]);
      expect(totals.income).toBe(5);
    });
  });

  describe("calculateBalance", () => {
    it("calculates income minus expenses", () => {
      const transactions = [
        makeTx({ id: "t1", type: "income", amount: "200" }),
        makeTx({ id: "t2", type: "expense", amount: "50" }),
      ];

      expect(calculateBalance(transactions)).toBe(150);
    });

    it("treats deposits as income", () => {
      const transactions = [
        makeTx({ id: "t1", type: "deposit", amount: "80" }),
      ];

      expect(calculateBalance(transactions)).toBe(80);
    });

    it("treats withdrawals as expenses", () => {
      const transactions = [
        makeTx({ id: "t1", type: "withdrawal", amount: "30" }),
      ];

      expect(calculateBalance(transactions)).toBe(-30);
    });

    it("combines deposits and withdrawals with base types", () => {
      const transactions = [
        makeTx({ id: "t1", type: "income", amount: "100" }),
        makeTx({ id: "t2", type: "deposit", amount: "40" }),
        makeTx({ id: "t3", type: "expense", amount: "20" }),
        makeTx({ id: "t4", type: "withdrawal", amount: "10" }),
      ];

      expect(calculateBalance(transactions)).toBe(110);
    });

    it("returns 0 when there are no transactions", () => {
      expect(calculateBalance([])).toBe(0);
    });
  });

  describe("getTransactionStats", () => {
    it("returns zeros for empty list", () => {
      const stats = getTransactionStats([]);
      expect(stats).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        balance: 0,
      });
    });

    it("includes deposits in total income", () => {
      const stats = getTransactionStats([
        makeTx({ id: "t1", type: "income", amount: "100" }),
        makeTx({ id: "t2", type: "deposit", amount: "40" }),
      ]);

      expect(stats.totalIncome).toBe(140);
    });

    it("includes withdrawals in total expenses", () => {
      const stats = getTransactionStats([
        makeTx({ id: "t1", type: "expense", amount: "25" }),
        makeTx({ id: "t2", type: "withdrawal", amount: "10" }),
      ]);

      expect(stats.totalExpenses).toBe(35);
    });

    it("calculates total savings separately", () => {
      const stats = getTransactionStats([
        makeTx({ id: "t1", type: "saving", amount: "60" }),
      ]);

      expect(stats.totalSavings).toBe(60);
    });

    it("balance equals income minus expenses", () => {
      const stats = getTransactionStats([
        makeTx({ id: "t1", type: "income", amount: "200" }),
        makeTx({ id: "t2", type: "expense", amount: "50" }),
      ]);

      expect(stats.balance).toBe(150);
    });
  });
});
