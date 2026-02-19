import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import type { BankAccount } from "@/types";

import {
  createBankAccount,
  deleteBankAccount,
  getBankAccounts,
  searchBankAccountByCBUOrAlias,
  updateBankAccount,
  updateBankAccountBalance,
} from "../bank-accounts";

// Mock all external modules
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock DB
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      bankAccounts: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

describe("Bank Account Actions", () => {
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
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });
    vi.mocked(db.insert).mockImplementation(mockInsert as any);

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    vi.mocked(db.update).mockImplementation(mockUpdate as any);

    const mockDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(db.delete).mockImplementation(mockDelete as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createBankAccount", () => {
    const mockData = {
      accountName: "Cuenta Corriente",
      bank: "Banco Galicia",
      accountType: "savings",
      accountNumber: "1234567890",
      cbu: "0070123430000001234567",
      alias: "mi.cuenta.galicia",
      currency: "ARS",
      balance: "50000.00",
      ownerName: "Juan Perez",
      ownerDocument: "12345678",
      notes: "Cuenta principal",
    };

    it("should create bank account with valid data", async () => {
      // Setup
      const mockAccount: BankAccount = {
        id: "acc-123",
        userId: "user-123",
        idempotencyKey: "test-key",
        accountName: mockData.accountName,
        bank: "banco_galicia",
        accountType: "savings",
        accountNumber: mockData.accountNumber,
        cbu: mockData.cbu,
        alias: mockData.alias,
        currency: mockData.currency,
        balance: mockData.balance,
        ownerName: mockData.ownerName,
        ownerDocument: mockData.ownerDocument,
        notes: mockData.notes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.bankAccounts.findFirst).mockResolvedValue(null as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockAccount]),
        }),
      } as any);

      // Execute
      const result = await createBankAccount(mockData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("acc-123");
        expect(result.value.accountName).toBe("Cuenta Corriente");
        expect(result.value.cbu).toBe("0070123430000001234567");
      }
      expect(db.insert).toHaveBeenCalled();
    });

    it("should return existing account for duplicate idempotency key", async () => {
      // Setup
      const existingAccount: BankAccount = {
        id: "acc-existing",
        userId: "user-123",
        idempotencyKey: "existing-key",
        accountName: mockData.accountName,
        bank: "banco_galicia",
        accountType: "savings",
        accountNumber: mockData.accountNumber,
        cbu: mockData.cbu,
        alias: mockData.alias,
        currency: mockData.currency,
        balance: mockData.balance,
        ownerName: mockData.ownerName,
        ownerDocument: mockData.ownerDocument,
        notes: mockData.notes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.bankAccounts.findFirst).mockResolvedValue(
        existingAccount as any,
      );

      // Execute
      const result = await createBankAccount(mockData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("acc-existing");
      }
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await createBankAccount(mockData);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });

    it("should handle database error gracefully", async () => {
      // Setup
      vi.mocked(db.query.bankAccounts.findFirst).mockResolvedValue(null as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockRejectedValue(new Error("DB connection failed")),
        }),
      } as any);

      // Execute
      const result = await createBankAccount(mockData);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });
  });

  describe("getBankAccounts", () => {
    it("should return user's bank accounts", async () => {
      // Setup
      const mockAccounts: BankAccount[] = [
        {
          id: "acc-1",
          userId: "user-123",
          idempotencyKey: "key-1",
          accountName: "Cuenta 1",
          bank: "banco_galicia",
          accountType: "savings",
          accountNumber: "1111111111",
          cbu: "1111111111111111111111",
          currency: "ARS",
          balance: "10000.00",
          ownerName: "User Test",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "acc-2",
          userId: "user-123",
          idempotencyKey: "key-2",
          accountName: "Cuenta 2",
          bank: "banco_nacion",
          accountType: "checking",
          accountNumber: "2222222222",
          cbu: "2222222222222222222222",
          currency: "USD",
          balance: "5000.00",
          ownerName: "User Test",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockAccounts),
        }),
      } as any);

      // Execute
      const result = await getBankAccounts();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].id).toBe("acc-1");
        expect(result.value[1].id).toBe("acc-2");
      }
    });

    it("should return empty array when no accounts exist", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await getBankAccounts();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await getBankAccounts();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("updateBankAccount", () => {
    it("should update bank account successfully", async () => {
      // Setup
      const existingAccount = {
        id: "acc-1",
        userId: "user-123",
        accountName: "Old Name",
      };

      const updatedAccount = {
        ...existingAccount,
        accountName: "New Name",
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingAccount]),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedAccount]),
          }),
        }),
      } as any);

      // Execute
      const result = await updateBankAccount("acc-1", {
        accountName: "New Name",
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.accountName).toBe("New Name");
      }
    });

    it("should return not found error for non-existent account", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await updateBankAccount("acc-999", {
        accountName: "New Name",
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await updateBankAccount("acc-1", {
        accountName: "New Name",
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("deleteBankAccount", () => {
    it("should delete bank account without transactions", async () => {
      // Setup
      const existingAccount = {
        id: "acc-1",
        userId: "user-123",
      };

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingAccount]),
        }),
      } as any);

      // Mock transactions check - no transactions
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await deleteBankAccount("acc-1");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it("should fail to delete account with associated transactions", async () => {
      // Setup
      const existingAccount = {
        id: "acc-1",
        userId: "user-123",
      };

      const associatedTransactions = [
        { id: "txn-1", fromBankAccountId: "acc-1" },
      ];

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingAccount]),
        }),
      } as any);

      // Mock transactions check - has transactions
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(associatedTransactions),
        }),
      } as any);

      // Execute
      const result = await deleteBankAccount("acc-1");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("VALIDATION");
      }
      expect(db.delete).not.toHaveBeenCalled();
    });

    it("should return not found error for non-existent account", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await deleteBankAccount("acc-999");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await deleteBankAccount("acc-1");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("updateBankAccountBalance", () => {
    it("should update account balance correctly", async () => {
      // Setup
      const existingAccount = {
        id: "acc-1",
        userId: "user-123",
        balance: "10000.00",
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingAccount]),
        }),
      } as any);

      // Execute
      const result = await updateBankAccountBalance("acc-1", "15000.00");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it("should return not found error for non-existent account", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await updateBankAccountBalance("acc-999", "15000.00");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await updateBankAccountBalance("acc-1", "15000.00");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("searchBankAccountByCBUOrAlias", () => {
    it("should find account by CBU", async () => {
      // Setup
      const mockAccount = {
        id: "acc-1",
        userId: "user-123",
        cbu: "0070123430000001234567",
        alias: "mi.cuenta.galicia",
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAccount]),
        }),
      } as any);

      // Execute
      const result = await searchBankAccountByCBUOrAlias(
        "0070123430000001234567",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("acc-1");
        expect(result.value.cbu).toBe("0070123430000001234567");
      }
    });

    it("should find account by alias", async () => {
      // Setup
      const mockAccount = {
        id: "acc-1",
        userId: "user-123",
        cbu: "0070123430000001234567",
        alias: "mi.cuenta.galicia",
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAccount]),
        }),
      } as any);

      // Execute
      const result = await searchBankAccountByCBUOrAlias("mi.cuenta.galicia");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("acc-1");
        expect(result.value.alias).toBe("mi.cuenta.galicia");
      }
    });

    it("should return not found error when account does not exist", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await searchBankAccountByCBUOrAlias("nonexistent.alias");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await searchBankAccountByCBUOrAlias("mi.cuenta.galicia");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });
});
