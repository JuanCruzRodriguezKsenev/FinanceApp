import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import type { DigitalWallet } from "@/types";

import {
  createDigitalWallet,
  deleteDigitalWallet,
  getDigitalWallets,
  updateDigitalWallet,
  updateWalletBalance,
} from "../digital-wallets";

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
      digitalWallets: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

describe("Digital Wallet Actions", () => {
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

  describe("createDigitalWallet", () => {
    const mockData = {
      walletName: "MercadoPago Principal",
      provider: "mercadopago",
      email: "test@example.com",
      phoneNumber: "+5491112345678",
      username: "test.user",
      currency: "ARS",
      balance: "25000.00",
    };

    it("should create digital wallet with valid data", async () => {
      // Setup
      const mockWallet: DigitalWallet = {
        id: "wallet-123",
        userId: "user-123",
        idempotencyKey: "test-key",
        walletName: mockData.walletName,
        provider: "mercado_pago",
        email: mockData.email,
        phoneNumber: mockData.phoneNumber,
        username: mockData.username,
        currency: mockData.currency,
        balance: mockData.balance,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.digitalWallets.findFirst).mockResolvedValue(
        null as any,
      );

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockWallet]),
        }),
      } as any);

      // Execute
      const result = await createDigitalWallet(mockData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("wallet-123");
        expect(result.value.walletName).toBe("MercadoPago Principal");
        expect(result.value.provider).toBe("mercado_pago");
      }
      expect(db.insert).toHaveBeenCalled();
    });

    it("should return existing wallet for duplicate idempotency key", async () => {
      // Setup
      const existingWallet: DigitalWallet = {
        id: "wallet-existing",
        userId: "user-123",
        idempotencyKey: "existing-key",
        walletName: mockData.walletName,
        provider: "mercado_pago",
        email: mockData.email,
        phoneNumber: mockData.phoneNumber,
        username: mockData.username,
        currency: mockData.currency,
        balance: mockData.balance,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.digitalWallets.findFirst).mockResolvedValue(
        existingWallet as any,
      );

      // Execute
      const result = await createDigitalWallet(mockData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("wallet-existing");
      }
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await createDigitalWallet(mockData);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });

    it("should handle database error gracefully", async () => {
      // Setup
      vi.mocked(db.query.digitalWallets.findFirst).mockResolvedValue(
        null as any,
      );

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockRejectedValue(new Error("DB connection failed")),
        }),
      } as any);

      // Execute
      const result = await createDigitalWallet(mockData);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });
  });

  describe("getDigitalWallets", () => {
    it("should return user's digital wallets", async () => {
      // Setup
      const mockWallets: DigitalWallet[] = [
        {
          id: "wallet-1",
          userId: "user-123",
          idempotencyKey: "key-1",
          walletName: "MercadoPago",
          provider: "mercado_pago",
          email: "test@example.com",
          currency: "ARS",
          balance: "10000.00",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "wallet-2",
          userId: "user-123",
          idempotencyKey: "key-2",
          walletName: "Ualá",
          provider: "ualá",
          phoneNumber: "+5491112345678",
          currency: "ARS",
          balance: "5000.00",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockWallets),
        }),
      } as any);

      // Execute
      const result = await getDigitalWallets();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].provider).toBe("mercado_pago");
        expect(result.value[1].provider).toBe("ualá");
      }
    });

    it("should return empty array when no wallets exist", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await getDigitalWallets();

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
      const result = await getDigitalWallets();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("updateDigitalWallet", () => {
    it("should update digital wallet successfully", async () => {
      // Setup
      const existingWallet = {
        id: "wallet-1",
        userId: "user-123",
        walletName: "Old Name",
      };

      const updatedWallet = {
        ...existingWallet,
        walletName: "New Name",
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingWallet]),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedWallet]),
          }),
        }),
      } as any);

      // Execute
      const result = await updateDigitalWallet("wallet-1", {
        walletName: "New Name",
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.walletName).toBe("New Name");
      }
    });

    it("should return not found error for non-existent wallet", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await updateDigitalWallet("wallet-999", {
        walletName: "New Name",
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
      const result = await updateDigitalWallet("wallet-1", {
        walletName: "New Name",
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("deleteDigitalWallet", () => {
    it("should delete digital wallet successfully", async () => {
      // Setup
      const existingWallet = {
        id: "wallet-1",
        userId: "user-123",
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingWallet]),
        }),
      } as any);

      // Execute
      const result = await deleteDigitalWallet("wallet-1");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it("should return not found error for non-existent wallet", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await deleteDigitalWallet("wallet-999");

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
      const result = await deleteDigitalWallet("wallet-1");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("updateWalletBalance", () => {
    it("should update wallet balance correctly", async () => {
      // Setup
      const existingWallet = {
        id: "wallet-1",
        userId: "user-123",
        balance: "10000.00",
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingWallet]),
        }),
      } as any);

      // Execute
      const result = await updateWalletBalance("wallet-1", "15000.00");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it("should return not found error for non-existent wallet", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await updateWalletBalance("wallet-999", "15000.00");

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
      const result = await updateWalletBalance("wallet-1", "15000.00");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });
  });
});
