import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import type { Contact } from "@/types";

import {
  createContact,
  deleteContact,
  getContacts,
  searchContactByCBUOrAlias,
  searchContacts,
  updateContact,
} from "../contacts";

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
      contacts: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe("Contact Actions", () => {
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
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
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

  describe("createContact", () => {
    const mockData = {
      name: "Juan Pérez",
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan.perez@example.com",
      phoneNumber: "+5491112345678",
      cbu: "0720047820000000123456",
      alias: "juan.perez",
      document: "20123456789",
      bank: "banco_galicia",
      accountNumber: "047-123456-8",
      bankAccountType: "savings",
      isFavorite: true,
      notes: "Cliente frecuente",
    };

    it("should create contact with valid data", async () => {
      // Setup
      const mockContact: Contact = {
        id: "contact-123",
        userId: "user-123",
        idempotencyKey: "test-key",
        name: mockData.name,
        firstName: mockData.firstName,
        lastName: mockData.lastName,
        email: mockData.email,
        phoneNumber: mockData.phoneNumber,
        cbu: mockData.cbu,
        alias: mockData.alias,
        document: mockData.document,
        bank: "banco_galicia",
        accountNumber: mockData.accountNumber,
        bankAccountType: "savings",
        isFavorite: mockData.isFavorite,
        notes: mockData.notes,
        displayName: null,
        iban: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.contacts.findFirst).mockResolvedValue(null as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockContact]),
        }),
      } as any);

      // Execute
      const result = await createContact(mockData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("contact-123");
        expect(result.value.name).toBe("Juan Pérez");
        expect(result.value.cbu).toBe("0720047820000000123456");
        expect(result.value.bank).toBe("banco_galicia");
      }
      expect(db.insert).toHaveBeenCalled();
    });

    it("should return existing contact for duplicate idempotency key", async () => {
      // Setup
      const existingContact: Contact = {
        id: "contact-existing",
        userId: "user-123",
        idempotencyKey: "existing-key",
        name: mockData.name,
        firstName: mockData.firstName,
        lastName: mockData.lastName,
        email: mockData.email,
        phoneNumber: mockData.phoneNumber,
        cbu: mockData.cbu,
        alias: mockData.alias,
        document: mockData.document,
        bank: "banco_galicia",
        accountNumber: mockData.accountNumber,
        bankAccountType: "savings",
        isFavorite: mockData.isFavorite,
        notes: mockData.notes,
        displayName: null,
        iban: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.contacts.findFirst).mockResolvedValue(
        existingContact as any,
      );

      // Execute
      const result = await createContact(mockData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("contact-existing");
      }
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should create contact with minimal data", async () => {
      // Setup
      const minimalData = {
        name: "Pedro López",
      };

      const mockMinimalContact: Contact = {
        id: "contact-minimal",
        userId: "user-123",
        idempotencyKey: "minimal-key",
        name: minimalData.name,
        firstName: null,
        lastName: null,
        displayName: null,
        email: null,
        phoneNumber: null,
        document: null,
        cbu: null,
        alias: null,
        iban: null,
        bank: null,
        accountNumber: null,
        bankAccountType: null,
        isFavorite: false,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.contacts.findFirst).mockResolvedValue(null as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockMinimalContact]),
        }),
      } as any);

      // Execute
      const result = await createContact(minimalData);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Pedro López");
        expect(result.value.isFavorite).toBe(false);
      }
    });

    it("should return authorization error when not authenticated", async () => {
      // Setup
      vi.mocked(auth).mockResolvedValue(null as any);

      // Execute
      const result = await createContact(mockData);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });

    it("should handle database error gracefully", async () => {
      // Setup
      vi.mocked(db.query.contacts.findFirst).mockResolvedValue(null as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockRejectedValue(new Error("DB connection failed")),
        }),
      } as any);

      // Execute
      const result = await createContact(mockData);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });
  });

  describe("getContacts", () => {
    it("should return user's contacts", async () => {
      // Setup
      const mockContacts: Contact[] = [
        {
          id: "contact-1",
          userId: "user-123",
          idempotencyKey: "key-1",
          name: "María González",
          firstName: "María",
          lastName: "González",
          displayName: null,
          email: "maria@example.com",
          phoneNumber: "+5491198765432",
          document: null,
          cbu: "0110599520000012345678",
          alias: "maria.gonzalez",
          iban: null,
          bank: "banco_nacion",
          accountNumber: "599520/12345678",
          bankAccountType: "checking",
          isFavorite: true,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "contact-2",
          userId: "user-123",
          idempotencyKey: "key-2",
          name: "Carlos Rodríguez",
          firstName: "Carlos",
          lastName: "Rodríguez",
          displayName: null,
          email: null,
          phoneNumber: "+5491187654321",
          document: "20987654321",
          cbu: null,
          alias: "carlos.rodriguez",
          iban: null,
          bank: null,
          accountNumber: null,
          bankAccountType: null,
          isFavorite: false,
          notes: "Contacto secundario",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockContacts),
        }),
      } as any);

      // Execute
      const result = await getContacts();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].name).toBe("María González");
        expect(result.value[1].name).toBe("Carlos Rodríguez");
      }
    });

    it("should return empty array when no contacts exist", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await getContacts();

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
      const result = await getContacts();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });

    it("should handle database error gracefully", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("DB connection failed")),
        }),
      } as any);

      // Execute
      const result = await getContacts();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });
  });

  describe("searchContacts", () => {
    it("should find contacts by name", async () => {
      // Setup
      const mockResults: Contact[] = [
        {
          id: "contact-1",
          userId: "user-123",
          idempotencyKey: "key-1",
          name: "Juan Carlos Pérez",
          firstName: "Juan",
          lastName: "Pérez",
          displayName: "Juancito",
          email: "juan@example.com",
          phoneNumber: null,
          document: null,
          cbu: null,
          alias: null,
          iban: null,
          bank: null,
          accountNumber: null,
          bankAccountType: null,
          isFavorite: false,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockResults),
        }),
      } as any);

      // Execute
      const result = await searchContacts("Juan");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].name).toContain("Juan");
      }
    });

    it("should find contacts by email", async () => {
      // Setup
      const mockResults: Contact[] = [
        {
          id: "contact-1",
          userId: "user-123",
          idempotencyKey: "key-1",
          name: "Test User",
          firstName: null,
          lastName: null,
          displayName: null,
          email: "test@example.com",
          phoneNumber: null,
          document: null,
          cbu: null,
          alias: null,
          iban: null,
          bank: null,
          accountNumber: null,
          bankAccountType: null,
          isFavorite: false,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockResults),
        }),
      } as any);

      // Execute
      const result = await searchContacts("test@example.com");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value[0].email).toBe("test@example.com");
      }
    });

    it("should return empty array when no matches found", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await searchContacts("nonexistent");

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
      const result = await searchContacts("test");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });

    it("should handle database error gracefully", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      } as any);

      // Execute
      const result = await searchContacts("test");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });
  });

  describe("searchContactByCBUOrAlias", () => {
    it("should find contact by CBU", async () => {
      // Setup
      const mockContact: Contact = {
        id: "contact-1",
        userId: "user-123",
        idempotencyKey: "key-1",
        name: "Contact with CBU",
        firstName: null,
        lastName: null,
        displayName: null,
        email: null,
        phoneNumber: null,
        document: null,
        cbu: "0720047820000000123456",
        alias: null,
        iban: null,
        bank: null,
        accountNumber: null,
        bankAccountType: null,
        isFavorite: false,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockContact]),
        }),
      } as any);

      // Execute
      const result = await searchContactByCBUOrAlias("0720047820000000123456");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.cbu).toBe("0720047820000000123456");
      }
    });

    it("should find contact by Alias", async () => {
      // Setup
      const mockContact: Contact = {
        id: "contact-1",
        userId: "user-123",
        idempotencyKey: "key-1",
        name: "Contact with Alias",
        firstName: null,
        lastName: null,
        displayName: null,
        email: null,
        phoneNumber: null,
        document: null,
        cbu: null,
        alias: "juan.perez",
        iban: null,
        bank: null,
        accountNumber: null,
        bankAccountType: null,
        isFavorite: false,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockContact]),
        }),
      } as any);

      // Execute
      const result = await searchContactByCBUOrAlias("juan.perez");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.alias).toBe("juan.perez");
      }
    });

    it("should return not found error when contact doesn't exist", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await searchContactByCBUOrAlias("nonexistent");

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
      const result = await searchContactByCBUOrAlias("test.alias");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });

    it("should handle database error gracefully", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      } as any);

      // Execute
      const result = await searchContactByCBUOrAlias("test.alias");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });
  });

  describe("updateContact", () => {
    it("should update contact successfully", async () => {
      // Setup
      const existingContact = {
        id: "contact-1",
        userId: "user-123",
        name: "Old Name",
      };

      const updatedContact: Contact = {
        id: "contact-1",
        userId: "user-123",
        idempotencyKey: "key-1",
        name: "New Name",
        firstName: "New",
        lastName: "Name",
        displayName: null,
        email: "newemail@example.com",
        phoneNumber: null,
        document: null,
        cbu: null,
        alias: null,
        iban: null,
        bank: null,
        accountNumber: null,
        bankAccountType: null,
        isFavorite: true,
        notes: "Updated notes",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingContact]),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedContact]),
          }),
        }),
      } as any);

      // Execute
      const result = await updateContact("contact-1", {
        name: "New Name",
        email: "newemail@example.com",
        isFavorite: true,
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("New Name");
        expect(result.value.email).toBe("newemail@example.com");
      }
    });

    it("should return not found error for non-existent contact", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await updateContact("contact-999", { name: "New Name" });

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
      const result = await updateContact("contact-1", { name: "New Name" });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });

    it("should handle database error gracefully", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "contact-1" }]),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      } as any);

      // Execute
      const result = await updateContact("contact-1", { name: "New Name" });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });
  });

  describe("deleteContact", () => {
    it("should delete contact successfully", async () => {
      // Setup
      const existingContact = {
        id: "contact-1",
        userId: "user-123",
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingContact]),
        }),
      } as any);

      // Execute
      const result = await deleteContact("contact-1");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it("should return not found error for non-existent contact", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Execute
      const result = await deleteContact("contact-999");

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
      const result = await deleteContact("contact-1");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }
    });

    it("should handle database error gracefully", async () => {
      // Setup
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "contact-1" }]),
        }),
      } as any);

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("DB error")),
      } as any);

      // Execute
      const result = await deleteContact("contact-1");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE");
      }
    });
  });
});
