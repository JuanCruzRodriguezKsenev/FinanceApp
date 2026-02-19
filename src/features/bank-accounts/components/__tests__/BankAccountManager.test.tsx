import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankAccountManager } from "../BankAccountManager";
import {
  createBankAccount,
  getBankAccounts,
  deleteBankAccount,
} from "../../actions";
import type { BankAccount } from "@/types";
import { ok, err, validationError } from "@/lib/result";

// Mock the server actions
vi.mock("../../actions", () => ({
  createBankAccount: vi.fn(),
  getBankAccounts: vi.fn(),
  deleteBankAccount: vi.fn(),
}));

// Mock useMessage hook
let mockMessage: { type: string; text: string } | null = null;
const mockShowError = vi.fn((text: string) => {
  mockMessage = { type: "error", text };
});
const mockShowSuccess = vi.fn((text: string) => {
  mockMessage = { type: "success", text };
});
const mockClear = vi.fn(() => {
  mockMessage = null;
});

vi.mock("@/hooks/useMessage", () => ({
  useMessage: () => ({
    get message() {
      return mockMessage;
    },
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    setMessage: vi.fn(),
    clear: mockClear,
  }),
}));

describe("BankAccountManager", () => {
  const mockAccounts: BankAccount[] = [
    {
      id: "bank-1",
      userId: "user-1",
      accountName: "Cuenta Santander",
      bank: "santander",
      accountType: "savings",
      accountNumber: "1234567890",
      cbu: "0720123456789012345678",
      alias: "juan.perez",
      currency: "ARS",
      balance: "10000.50",
      ownerName: "Juan Pérez",
      ownerDocument: "12345678",
      notes: "Cuenta principal",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "bank-2",
      userId: "user-1",
      accountName: "Caja Ahorro USD",
      bank: "bbva",
      accountType: "savings",
      accountNumber: "9876543210",
      cbu: null,
      alias: "ahorro.dolares",
      currency: "USD",
      balance: "500.00",
      ownerName: "Juan Pérez",
      ownerDocument: null,
      notes: null,
      isActive: true,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockMessage = null;
    // Reset window.confirm mock
    global.confirm = vi.fn(() => true);
  });

  describe("Rendering and Initial Load", () => {
    it("should load and display accounts on mount", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok(mockAccounts));

      render(<BankAccountManager />);

      // Should show loading initially
      expect(screen.getByText("Cargando...")).toBeInTheDocument();

      // Should load accounts
      await waitFor(() => {
        expect(screen.getByText("Cuenta Santander")).toBeInTheDocument();
      });

      expect(screen.getByText("Caja Ahorro USD")).toBeInTheDocument();
      expect(getBankAccounts).toHaveBeenCalledTimes(1);
    });

    it("should show empty state when no accounts exist", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok([]));

      render(<BankAccountManager />);

      await waitFor(() => {
        expect(
          screen.getByText("No tienes cuentas bancarias agregadas"),
        ).toBeInTheDocument();
      });
    });

    it("should show error when loading accounts fails", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(
        err(validationError("accounts", "Error al cargar cuentas")),
      );

      render(<BankAccountManager />);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith("Error al cargar cuentas");
      });
    });
  });

  describe("Account List Display", () => {
    it("should display account details correctly", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok(mockAccounts));

      render(<BankAccountManager />);

      await waitFor(() => {
        expect(screen.getByText("Cuenta Santander")).toBeInTheDocument();
      });

      // Check account details
      expect(screen.getByText("santander")).toBeInTheDocument();
      expect(screen.getByText("1234567890")).toBeInTheDocument();
      expect(screen.getByText("0720123456789012345678")).toBeInTheDocument();
      expect(screen.getByText("juan.perez")).toBeInTheDocument();
      expect(screen.getAllByText("Juan Pérez")[0]).toBeInTheDocument();
      expect(screen.getByText("ARS 10000.50")).toBeInTheDocument();
    });

    it("should display multiple accounts", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok(mockAccounts));

      render(<BankAccountManager />);

      await waitFor(() => {
        expect(screen.getByText("Cuenta Santander")).toBeInTheDocument();
        expect(screen.getByText("Caja Ahorro USD")).toBeInTheDocument();
      });
    });
  });

  describe("Add Account Form", () => {
    it("should show form when add button is clicked", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok([]));

      const user = userEvent.setup();
      render(<BankAccountManager />);

      // Wait for initial load
      await waitFor(() => {
        expect(
          screen.getByText("No tienes cuentas bancarias agregadas"),
        ).toBeInTheDocument();
      });

      // Click add button
      const addButton = screen.getByRole("button", {
        name: /agregar cuenta/i,
      });
      await user.click(addButton);

      // Form should be visible
      expect(
        screen.getByPlaceholderText(/mi caja de ahorro santander/i),
      ).toBeInTheDocument();
    });

    it("should hide form when cancel button is clicked", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok([]));

      const user = userEvent.setup();
      render(<BankAccountManager />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /agregar cuenta/i }),
        ).toBeInTheDocument();
      });

      // Show form
      const addButton = screen.getByRole("button", {
        name: /agregar cuenta/i,
      });
      await user.click(addButton);

      // Form should be visible
      expect(
        screen.getByPlaceholderText(/mi caja de ahorro santander/i),
      ).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancelar/i });
      await user.click(cancelButton);

      // Form should be hidden
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/mi caja de ahorro santander/i),
        ).not.toBeInTheDocument();
      });
    });

    it("should submit form with valid data", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok([]));
      vi.mocked(createBankAccount).mockResolvedValue(
        ok({
          ...mockAccounts[0],
          id: "new-bank-1",
        }),
      );

      const user = userEvent.setup();
      render(<BankAccountManager />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /agregar cuenta/i }),
        ).toBeInTheDocument();
      });

      // Open form
      await user.click(screen.getByRole("button", { name: /agregar cuenta/i }));

      // Fill form
      const accountNameInput = screen.getByPlaceholderText(
        /mi caja de ahorro santander/i,
      );
      await user.type(accountNameInput, "Nueva Cuenta");

      const accountNumberInput = screen.getByPlaceholderText(/ej: 1234567890/i);
      await user.type(accountNumberInput, "1234567890");

      const ownerNameInput = screen.getByPlaceholderText(/ej: juan pérez/i);
      await user.type(ownerNameInput, "Test User");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /guardar cuenta/i,
      });
      await user.click(submitButton);

      // Should call create action
      await waitFor(() => {
        expect(createBankAccount).toHaveBeenCalledWith(
          expect.objectContaining({
            accountName: "Nueva Cuenta",
            accountNumber: "1234567890",
            ownerName: "Test User",
          }),
        );
      });

      // Should show success message
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Cuenta bancaria creada exitosamente",
      );

      // Should hide form
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/mi caja de ahorro santander/i),
        ).not.toBeInTheDocument();
      });

      // Should reload accounts
      expect(getBankAccounts).toHaveBeenCalledTimes(2);
    });

    it("should show error when account creation fails", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok([]));
      vi.mocked(createBankAccount).mockResolvedValue(
        err(validationError("accountName", "El nombre es requerido")),
      );

      const user = userEvent.setup();
      render(<BankAccountManager />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /agregar cuenta/i }),
        ).toBeInTheDocument();
      });

      // Open form
      await user.click(screen.getByRole("button", { name: /agregar cuenta/i }));

      // Fill minimal form
      const accountNameInput = screen.getByPlaceholderText(
        /mi caja de ahorro santander/i,
      );
      await user.type(accountNameInput, "N");

      // Submit using fireEvent to bypass HTML5 validation
      const submitButton = screen.getByRole("button", {
        name: /guardar cuenta/i,
      });
      const form = submitButton.closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith("El nombre es requerido");
      });
    });
  });

  describe("Delete Account", () => {
    it("should delete account with confirmation", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok(mockAccounts));
      vi.mocked(deleteBankAccount).mockResolvedValue(ok(undefined));
      global.confirm = vi.fn(() => true);

      const user = userEvent.setup();
      render(<BankAccountManager />);

      await waitFor(() => {
        expect(screen.getByText("Cuenta Santander")).toBeInTheDocument();
      });

      // Click delete button on first account
      const deleteButtons = screen.getAllByRole("button", {
        name: /eliminar/i,
      });
      await user.click(deleteButtons[0]);

      // Should show confirmation
      expect(global.confirm).toHaveBeenCalledWith(
        "¿Estás seguro de que deseas eliminar esta cuenta?",
      );

      // Should delete account
      await waitFor(() => {
        expect(deleteBankAccount).toHaveBeenCalledWith("bank-1");
      });

      // Should reload accounts
      expect(getBankAccounts).toHaveBeenCalledTimes(2);
    });

    it("should not delete when confirmation is cancelled", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok(mockAccounts));
      global.confirm = vi.fn(() => false);

      const user = userEvent.setup();
      render(<BankAccountManager />);

      await waitFor(() => {
        expect(screen.getByText("Cuenta Santander")).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole("button", {
        name: /eliminar/i,
      });
      await user.click(deleteButtons[0]);

      // Should not delete
      expect(deleteBankAccount).not.toHaveBeenCalled();
    });

    it("should show error when delete fails", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok(mockAccounts));
      vi.mocked(deleteBankAccount).mockResolvedValue(
        err(
          validationError(
            "account",
            "No se puede eliminar cuenta con transacciones",
          ),
        ),
      );
      global.confirm = vi.fn(() => true);

      const user = userEvent.setup();
      render(<BankAccountManager />);

      await waitFor(() => {
        expect(screen.getByText("Cuenta Santander")).toBeInTheDocument();
      });

      // Click delete
      const deleteButtons = screen.getAllByRole("button", {
        name: /eliminar/i,
      });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          "No se puede eliminar cuenta con transacciones",
        );
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state during account creation", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok([]));
      vi.mocked(createBankAccount).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(ok({ id: "new" } as any)), 100),
          ),
      );

      const user = userEvent.setup();
      render(<BankAccountManager />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /agregar cuenta/i }),
        ).toBeInTheDocument();
      });

      // Open and submit form
      await user.click(screen.getByRole("button", { name: /agregar cuenta/i }));

      const accountNameInput = screen.getByPlaceholderText(
        /mi caja de ahorro santander/i,
      );
      await user.type(accountNameInput, "Test");

      const accountNumberInput = screen.getByPlaceholderText(/ej: 1234567890/i);
      await user.type(accountNumberInput, "123");

      const ownerNameInput = screen.getByPlaceholderText(/ej: juan pérez/i);
      await user.type(ownerNameInput, "Test User");

      const submitButton = screen.getByRole("button", {
        name: /guardar cuenta/i,
      });
      await user.click(submitButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText("Guardando...")).toBeInTheDocument();
      });
    });

    it("should disable buttons during loading", async () => {
      vi.mocked(getBankAccounts).mockResolvedValue(ok(mockAccounts));
      vi.mocked(deleteBankAccount).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(ok(undefined)), 100),
          ),
      );
      global.confirm = vi.fn(() => true);

      const user = userEvent.setup();
      render(<BankAccountManager />);

      await waitFor(() => {
        expect(screen.getByText("Cuenta Santander")).toBeInTheDocument();
      });

      // Click delete
      const deleteButtons = screen.getAllByRole("button", {
        name: /eliminar/i,
      });
      await user.click(deleteButtons[0]);

      // Buttons should be disabled
      await waitFor(() => {
        const addButton = screen.getByRole("button", {
          name: /agregar cuenta/i,
        });
        expect(addButton).toBeDisabled();
      });
    });
  });
});
