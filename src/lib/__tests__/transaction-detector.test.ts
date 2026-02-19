import { describe, expect, it } from "vitest";
import {
  detectCategoryFromDescription,
  detectSuspiciousActivity,
  detectTransactionType,
  type TransactionDetectionInput,
} from "@/lib/transaction-detector";

const baseInput: TransactionDetectionInput = {
  amount: 100,
  description: "test",
  userAccountIds: ["acc-1", "acc-2"],
  userBankAccountIds: ["bank-1", "bank-2"],
  userWalletIds: ["wallet-1", "wallet-2"],
};

const makeInput = (
  overrides: Partial<TransactionDetectionInput>,
): TransactionDetectionInput => ({
  ...baseInput,
  ...overrides,
});

describe("detectTransactionType", () => {
  it("detects transfer between own accounts", () => {
    const result = detectTransactionType(
      makeInput({ fromAccountId: "acc-1", toAccountId: "acc-2" }),
    );

    expect(result.type).toBe("transfer_own_accounts");
    expect(result.isTransferBetweenOwnAccounts).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("detects transfer between own bank accounts", () => {
    const result = detectTransactionType(
      makeInput({ fromBankAccountId: "bank-1", toBankAccountId: "bank-2" }),
    );

    expect(result.type).toBe("transfer_own_accounts");
    expect(result.isTransferBetweenOwnAccounts).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("detects transfer between own wallets", () => {
    const result = detectTransactionType(
      makeInput({ fromWalletId: "wallet-1", toWalletId: "wallet-2" }),
    );

    expect(result.type).toBe("transfer_own_accounts");
    expect(result.isTransferBetweenOwnAccounts).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("detects cash withdrawal", () => {
    const result = detectTransactionType(
      makeInput({
        paymentMethod: "cash",
        fromBankAccountId: "bank-1",
      }),
    );

    expect(result.type).toBe("withdrawal");
    expect(result.isCashWithdrawal).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("detects cash deposit", () => {
    const result = detectTransactionType(
      makeInput({
        paymentMethod: "cash",
        toWalletId: "wallet-1",
        fromBankAccountId: undefined,
        fromWalletId: undefined,
        fromAccountId: undefined,
      }),
    );

    expect(result.type).toBe("deposit");
    expect(result.isCashDeposit).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("detects transfer to third party via external target", () => {
    const result = detectTransactionType(
      makeInput({
        fromBankAccountId: "bank-1",
        toBankAccountId: "bank-ext",
      }),
    );

    expect(result.type).toBe("transfer_third_party");
    expect(result.isTransferToThirdParty).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("detects transfer to third party with transfer keyword", () => {
    const result = detectTransactionType(
      makeInput({
        fromAccountId: "acc-1",
        toAccountId: "acc-ext",
        description: "transfer to vendor",
      }),
    );

    expect(result.type).toBe("transfer_third_party");
    expect(result.isTransferToThirdParty).toBe(true);
  });

  it("detects income from salary keyword", () => {
    const result = detectTransactionType(
      makeInput({
        amount: 500,
        description: "Salary Feb",
        fromBankAccountId: undefined,
        fromWalletId: undefined,
      }),
    );

    expect(result.type).toBe("income");
    expect(result.confidence).toBe("high");
  });

  it("detects income from bonus keyword", () => {
    const result = detectTransactionType(
      makeInput({
        amount: 500,
        description: "Bonus payout",
        fromBankAccountId: undefined,
        fromWalletId: undefined,
      }),
    );

    expect(result.type).toBe("income");
    expect(result.confidence).toBe("high");
  });

  it("defaults to expense when only source account is provided", () => {
    const result = detectTransactionType(
      makeInput({ fromAccountId: "acc-1", toAccountId: undefined }),
    );

    expect(result.type).toBe("expense");
  });

  it("defaults to income when no source and amount is positive", () => {
    const result = detectTransactionType(
      makeInput({
        fromBankAccountId: undefined,
        fromWalletId: undefined,
        fromAccountId: undefined,
        amount: 200,
      }),
    );

    expect(result.type).toBe("income");
  });

  it("treats income keyword as income even when source account exists", () => {
    const result = detectTransactionType(
      makeInput({
        fromAccountId: "acc-1",
        description: "salary payment",
      }),
    );

    expect(result.type).toBe("income");
  });

  it("cash withdrawal does not set transfer flags", () => {
    const result = detectTransactionType(
      makeInput({
        paymentMethod: "cash",
        fromWalletId: "wallet-1",
      }),
    );

    expect(result.isTransferBetweenOwnAccounts).toBe(false);
    expect(result.isTransferToThirdParty).toBe(false);
  });

  it("cash deposit does not set transfer flags", () => {
    const result = detectTransactionType(
      makeInput({
        paymentMethod: "cash",
        toAccountId: "acc-1",
        fromBankAccountId: undefined,
        fromWalletId: undefined,
        fromAccountId: undefined,
      }),
    );

    expect(result.isTransferBetweenOwnAccounts).toBe(false);
    expect(result.isTransferToThirdParty).toBe(false);
  });

  it("transfer between own accounts returns high confidence", () => {
    const result = detectTransactionType(
      makeInput({ fromAccountId: "acc-1", toAccountId: "acc-2" }),
    );

    expect(result.confidence).toBe("high");
  });
});

describe("detectCategoryFromDescription", () => {
  it("detects food from restaurant", () => {
    expect(detectCategoryFromDescription("Restaurant dinner")).toBe("food");
  });

  it("detects food from supermercado", () => {
    expect(detectCategoryFromDescription("Supermercado semanal")).toBe("food");
  });

  it("detects transportation from uber", () => {
    expect(detectCategoryFromDescription("Uber ride")).toBe("transportation");
  });

  it("detects transportation from nafta", () => {
    expect(detectCategoryFromDescription("Nafta premium")).toBe(
      "transportation",
    );
  });

  it("detects utilities from internet", () => {
    expect(detectCategoryFromDescription("Pago internet")).toBe("utilities");
  });

  it("detects utilities from gas", () => {
    expect(detectCategoryFromDescription("Factura gas")).toBe("utilities");
  });

  it("detects health from farmacia", () => {
    expect(detectCategoryFromDescription("Farmacia")).toBe("health");
  });

  it("detects health from hospital", () => {
    expect(detectCategoryFromDescription("Hospital visit")).toBe("health");
  });

  it("detects entertainment from netflix", () => {
    expect(detectCategoryFromDescription("Netflix subscription")).toBe(
      "entertainment",
    );
  });

  it("detects entertainment from cine", () => {
    expect(detectCategoryFromDescription("Cine con amigos")).toBe(
      "entertainment",
    );
  });

  it("detects shopping from amazon", () => {
    expect(detectCategoryFromDescription("Amazon order")).toBe("shopping");
  });

  it("detects food from mercadolibre", () => {
    expect(detectCategoryFromDescription("MercadoLibre compra")).toBe("food");
  });

  it("detects rent from alquiler", () => {
    expect(detectCategoryFromDescription("Alquiler depto")).toBe("rent");
  });

  it("detects rent from rent keyword", () => {
    expect(detectCategoryFromDescription("Rent payment")).toBe("rent");
  });

  it("detects taxes from impuesto", () => {
    expect(detectCategoryFromDescription("Impuesto municipal")).toBe("taxes");
  });

  it("detects taxes from tax", () => {
    expect(detectCategoryFromDescription("Tax refund")).toBe("taxes");
  });

  it("detects subscription from suscripcion with accent", () => {
    expect(detectCategoryFromDescription("Suscripción anual")).toBe(
      "subscription",
    );
  });

  it("detects subscription from subscription keyword", () => {
    expect(detectCategoryFromDescription("Subscription plan")).toBe(
      "subscription",
    );
  });

  it("returns null for unknown description", () => {
    expect(detectCategoryFromDescription("random purchase")).toBe(null);
  });

  it("returns null for empty description", () => {
    expect(detectCategoryFromDescription("")).toBe(null);
  });
});

describe("detectSuspiciousActivity", () => {
  const baseSuspiciousInput = {
    amount: 100,
    description: "test",
  };

  it("flags amount significantly above average", () => {
    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      amount: 1000,
      userAverageAmount: 100,
    });

    expect(result.isSuspicious).toBe(true);
    expect(result.reasons).toHaveLength(1);
  });

  it("does not flag when amount equals 5x average", () => {
    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      amount: 500,
      userAverageAmount: 100,
    });

    expect(result.isSuspicious).toBe(false);
  });

  it("flags many recent transactions", () => {
    const now = Date.now();
    const previousTransactions = Array.from({ length: 11 }, (_, idx) => ({
      amount: 10,
      date: new Date(now - idx * 60 * 1000),
    }));

    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      previousTransactions,
    });

    expect(result.isSuspicious).toBe(true);
    expect(result.reasons).toHaveLength(1);
  });

  it("does not flag when recent transactions are 10 or fewer", () => {
    const now = Date.now();
    const previousTransactions = Array.from({ length: 10 }, (_, idx) => ({
      amount: 10,
      date: new Date(now - idx * 60 * 1000),
    }));

    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      previousTransactions,
    });

    expect(result.isSuspicious).toBe(false);
  });

  it("ignores transactions older than 24 hours", () => {
    const previousTransactions = [
      {
        amount: 10,
        date: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    ];

    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      previousTransactions,
    });

    expect(result.isSuspicious).toBe(false);
  });

  it("returns two reasons when multiple rules trigger", () => {
    const now = Date.now();
    const previousTransactions = Array.from({ length: 12 }, (_, idx) => ({
      amount: 10,
      date: new Date(now - idx * 60 * 1000),
    }));

    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      amount: 1000,
      userAverageAmount: 100,
      previousTransactions,
    });

    expect(result.isSuspicious).toBe(true);
    expect(result.reasons).toHaveLength(2);
  });

  it("does not flag when average amount is zero", () => {
    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      amount: 1000,
      userAverageAmount: 0,
    });

    expect(result.isSuspicious).toBe(false);
  });

  it("flags negative large amount by absolute value", () => {
    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      amount: -1000,
      userAverageAmount: 100,
    });

    expect(result.isSuspicious).toBe(true);
  });

  it("returns not suspicious when no previous transactions and average is zero", () => {
    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      userAverageAmount: 0,
    });

    expect(result.isSuspicious).toBe(false);
    expect(result.reasons).toEqual([]);
  });

  it("returns not suspicious when previousTransactions is empty", () => {
    const result = detectSuspiciousActivity({
      ...baseSuspiciousInput,
      previousTransactions: [],
    });

    expect(result.isSuspicious).toBe(false);
  });
});
