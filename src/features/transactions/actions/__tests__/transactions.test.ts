import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  detectCategoryFromDescription,
  detectTransactionType,
} from "@/lib/transaction-detector";
import type { TransactionCategory, TransactionType } from "@/types";

import {
  createTransactionWithAutoDetection,
  flagTransactionAsSuspicious,
  getTransactionsWithMetadata,
  updateBalancesAfterTransaction,
} from "../transactions";

// Mock all external modules
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock additional modules
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
    query: {
      transactions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      accounts: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      bankAccounts: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      digitalWallets: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));
vi.mock("@/lib/transaction-detector");

describe("Transaction Actions", () => {
  const mockSession = {
    user: {
      id: "user-123",
      email: "test@example.com",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);

    // Setup chainable mocks for db operations
    // db.insert mock
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });
    vi.mocked(db.insert).mockImplementation(mockInsert as any);

    // db.update mock
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    vi.mocked(db.update).mockImplementation(mockUpdate as any);

    // db.transaction mock - executes callback immediately
    vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
      // Create a transaction context with same methods as db
      const tx = {
        select: db.select,
        insert: db.insert,
        update: db.update,
        delete: db.delete,
        query: db.query,
      };
      return callback(tx);
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createTransactionWithAutoDetection", () => {
    const mockData = {
      amount: 1000,
      currency: "ARS",
      description: "Compra supermercado",
      date: new Date("2026-02-18"),
      paymentMethod: "credit_card" as const,
      idempotencyKey: "test-key-123",
    };

    beforeEach(() => {
      // Mock DB queries for user accounts/banks/wallets
      const mockDBSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockDBSelect as any);

      // Mock db.query for idempotency checks
      vi.mocked(db.query.transactions.findFirst).mockResolvedValue(null as any);

      // Mock transaction detector
      vi.mocked(detectTransactionType).mockReturnValue({
        type: "expense" as TransactionType,
        isTransferBetweenOwnAccounts: false,
        isTransferToThirdParty: false,
        isCashWithdrawal: false,
        isCashDeposit: false,
        confidence: "high" as const,
      });

      vi.mocked(detectCategoryFromDescription).mockReturnValue(
        "groceries" as TransactionCategory,
      );
    });

    it("should create transaction with auto-detected type successfully", async () => {
      // Setup: Mock DB insert
      const mockTransaction = {
        id: "txn-123",
        userId: "user-123",
        type: "expense" as TransactionType,
        category: "groceries" as TransactionCategory,
        amount: 1000,
        currency: "ARS",
        description: "Compra supermercado",
        date: new Date("2026-02-18"),
        state: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockTransaction]),
        }),
      } as any);

      // Execute
      const result = await createTransactionWithAutoDetection(mockData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeDefined();
        expect(result.value.type).toBe("expense");
        expect(result.value.category).toBe("groceries");
      }

      expect(detectTransactionType).toHaveBeenCalled();
      expect(detectCategoryFromDescription).toHaveBeenCalledWith(
        "Compra supermercado",
      );
    });

    it("should return authorization error when user is not authenticated", async () => {
      // Setup: Mock no session
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await createTransactionWithAutoDetection(mockData);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
        if (result.error.type === "UNAUTHORIZED") {
          expect(result.error.resource).toBe("transactions");
        }
      }
    });

    it("should use provided category instead of auto-detection", async () => {
      // Setup: Mock DB insert
      const mockTransaction = {
        id: "txn-124",
        userId: "user-123",
        type: "expense" as TransactionType,
        category: "transportation" as TransactionCategory,
        amount: 500,
        currency: "ARS",
        description: "Taxi",
        date: new Date("2026-02-18"),
        state: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockTransaction]),
        }),
      } as any);

      // Execute: Provide explicit category
      const dataWithCategory = {
        ...mockData,
        description: "Taxi",
        amount: 500,
        category: "transportation" as TransactionCategory,
      };
      const result = await createTransactionWithAutoDetection(dataWithCategory);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.category).toBe("transportation");
      }

      // Category detector should NOT be called when category provided
      expect(detectCategoryFromDescription).not.toHaveBeenCalled();
    });

    it("should handle database error gracefully", async () => {
      // Setup: Mock DB error
      vi.mocked(db.insert).mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      // Execute
      const result = await createTransactionWithAutoDetection(mockData);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });

    it("should validate currency mismatch with source account", async () => {
      // Setup: Mock account with different currency
      const mockAccountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: "acc-1", currency: "USD" }, // Different from ARS
          ]),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockAccountSelect as any);

      // Execute: Try to use ARS with USD account
      const dataWithAccount = {
        ...mockData,
        fromAccountId: "acc-1",
        currency: "ARS",
      };
      const result = await createTransactionWithAutoDetection(dataWithAccount);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("VALIDATION");
        if (result.error.type === "VALIDATION") {
          expect(result.error.message).toContain("moneda");
        }
      }
    });

    it("should handle idempotency correctly - return same result for duplicate request", async () => {
      // Setup: Mock existing transaction with same idempotency key
      const existingTransaction = {
        id: "txn-existing",
        userId: "user-123",
        type: "expense" as TransactionType,
        category: "groceries" as TransactionCategory,
        amount: 1000,
        currency: "ARS",
        description: "Compra supermercado",
        idempotencyKey: "test-key-123",
        date: new Date("2026-02-18"),
        state: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock findFirst to return existing transaction
      vi.mocked(db.query.transactions.findFirst).mockResolvedValue(
        existingTransaction as any,
      );

      // Execute
      const result = await createTransactionWithAutoDetection(mockData);

      // Assert - Should return existing transaction, not create new one
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("txn-existing");
      }
      // Should NOT call insert
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should auto-detect transfer type when both accounts provided", async () => {
      // Setup: Mock user accounts
      vi.mocked(db.select).mockImplementation((() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "acc-1" }, { id: "acc-2" }]),
        }),
      })) as any);

      vi.mocked(detectTransactionType).mockReturnValue({
        type: "transfer_own_accounts" as TransactionType,
        isTransferBetweenOwnAccounts: true,
        isTransferToThirdParty: false,
        isCashWithdrawal: false,
        isCashDeposit: false,
        confidence: "high" as const,
      });

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "txn-transfer",
              type: "transfer_own_accounts",
              category: "other",
            },
          ]),
        }),
      } as any);

      // Execute
      const transferData = {
        ...mockData,
        fromAccountId: "acc-1",
        toAccountId: "acc-2",
        description: "Transfer between accounts",
      };
      const result = await createTransactionWithAutoDetection(transferData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("transfer_own_accounts");
        expect(result.value.category).toBe("other");
      }
    });
  });

  describe("updateBalancesAfterTransaction", () => {
    it("should update account balances correctly for transaction", async () => {
      // Setup: Mock transaction
      const mockTransaction = {
        id: "txn-1",
        userId: "user-123",
        type: "expense",
        amount: 1000,
        fromAccountId: "acc-1",
      };

      const mockAccount = {
        id: "acc-1",
        balance: 5000,
        currency: "ARS",
      };

      let selectCallCount = 0;
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            // First call returns transaction, second returns account
            if (selectCallCount === 1) {
              return Promise.resolve([mockTransaction]);
            }
            return Promise.resolve([mockAccount]);
          }),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ balance: 4000 }]),
        }),
      } as any);

      // Execute
      const result = await updateBalancesAfterTransaction("txn-1");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it("should update account balances correctly for income", async () => {
      // Setup
      const mockTransaction = {
        id: "txn-2",
        userId: "user-123",
        type: "income",
        amount: 1000,
        toAccountId: "acc-1",
      };

      const mockAccount = {
        id: "acc-1",
        balance: 5000,
        currency: "ARS",
      };

      let selectCallCount = 0;
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              return Promise.resolve([mockTransaction]);
            }
            return Promise.resolve([mockAccount]);
          }),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ balance: 6000 }]),
        }),
      } as any);

      // Execute
      const result = await updateBalancesAfterTransaction("txn-2");

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle transfer between accounts correctly", async () => {
      // Setup: Mock transaction and both accounts
      const mockTransaction = {
        id: "txn-3",
        userId: "user-123",
        type: "transfer_own_accounts",
        amount: 1000,
        fromAccountId: "acc-1",
        toAccountId: "acc-2",
      };

      let selectCallCount = 0;
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              return Promise.resolve([mockTransaction]);
            } else if (selectCallCount === 2) {
              return Promise.resolve([{ id: "acc-1", balance: 5000 }]);
            } else {
              return Promise.resolve([{ id: "acc-2", balance: 3000 }]);
            }
          }),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await updateBalancesAfterTransaction("txn-3");

      // Assert
      expect(result.isOk()).toBe(true);
      // Should call update twice (source and target)
      expect(db.update).toHaveBeenCalledTimes(2);
    });

    it("should return error when transaction not found", async () => {
      // Setup: Mock no transaction found
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await updateBalancesAfterTransaction("non-existent");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });

  describe("flagTransactionAsSuspicious", () => {
    it("should mark transaction as suspicious successfully", async () => {
      // Setup: Mock existing transaction
      const mockTransaction = {
        id: "txn-1",
        userId: "user-123",
        isSuspicious: false,
        suspiciousReason: null,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockTransaction]),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              ...mockTransaction,
              isSuspicious: true,
              suspiciousReason: "Large amount",
            },
          ]),
        }),
      } as any);

      // Execute
      const result = await flagTransactionAsSuspicious("txn-1", "Large amount");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it("should return error when transaction not found", async () => {
      // Setup: Mock no transaction
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await flagTransactionAsSuspicious(
        "non-existent",
        "Test reason",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    it("should update suspiciousReason even if already flagged", async () => {
      // Setup: Mock already suspicious transaction
      const mockTransaction = {
        id: "txn-1",
        userId: "user-123",
        isSuspicious: true,
        suspiciousReason: "Old reason",
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockTransaction]),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              ...mockTransaction,
              suspiciousReason: "New reason",
            },
          ]),
        }),
      } as any);

      // Execute
      const result = await flagTransactionAsSuspicious("txn-1", "New reason");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it("should return authorization error for other user's transaction", async () => {
      // Setup: Mock transaction belonging to another user
      // Since the WHERE clause filters by userId, it should return empty array
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // Empty because user doesn't own it
        }),
      } as any);

      // Execute
      const result = await flagTransactionAsSuspicious("txn-1", "Test");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });

  describe("getTransactionsWithMetadata", () => {
    it("should return transactions with metadata successfully", async () => {
      // Setup: Mock query result
      const mockTransactions = [
        {
          id: "txn-1",
          userId: "user-123",
          type: "expense",
          category: "groceries",
          amount: 1000,
          description: "Supermercado",
        },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            // First call returns transactions, second returns metadata
            if (selectCallCount === 1) {
              return Promise.resolve(mockTransactions);
            }
            return Promise.resolve([{ tags: ["food"] }]);
          }),
        }),
      } as any);

      // Execute
      const result = await getTransactionsWithMetadata();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].id).toBe("txn-1");
      }
    });

    it("should return empty array when no transactions found", async () => {
      // Setup: Mock empty result
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await getTransactionsWithMetadata();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup: No session
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await getTransactionsWithMetadata();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });
});
