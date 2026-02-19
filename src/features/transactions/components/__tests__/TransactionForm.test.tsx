import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionForm from "../TransactionForm";
import { createTransactionWithAutoDetection } from "../../actions";
import type { Account, SavingsGoal, BankAccount, DigitalWallet } from "@/types";
import { ok, err, validationError } from "@/lib/result";

// Mock the server action
vi.mock("../../actions", () => ({
  createTransactionWithAutoDetection: vi.fn(),
}));

// Mock eventBus
vi.mock("@/lib/eventBus", () => ({
  eventBus: {
    publish: vi.fn(),
  },
  EVENTS: {
    TRANSACTION: {
      CREATED: "transaction:created",
    },
  },
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

describe("TransactionForm", () => {
  const mockAccounts: Account[] = [
    {
      id: "acc-1",
      userId: "user-1",
      name: "Caja Personal",
      type: "cash",
      currency: "ARS",
      balance: "10000",
      icon: "💰",
      color: "#4CAF50",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "acc-2",
      userId: "user-1",
      name: "Ahorros USD",
      type: "savings",
      currency: "USD",
      balance: "500",
      icon: "💵",
      color: "#2196F3",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockGoals: SavingsGoal[] = [];

  const mockBankAccounts: BankAccount[] = [
    {
      id: "bank-1",
      userId: "user-1",
      idempotencyKey: "key-1",
      accountName: "Cuenta Sueldo",
      bank: "banco_galicia",
      accountType: "checking",
      accountNumber: "123456",
      cbu: "0720047820000000123456",
      alias: "sueldo.galicia",
      currency: "ARS",
      balance: "25000",
      ownerName: "Juan Perez",
      ownerDocument: "12345678",
      isActive: true,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockDigitalWallets: DigitalWallet[] = [
    {
      id: "wallet-1",
      userId: "user-1",
      idempotencyKey: "key-1",
      walletName: "MercadoPago",
      provider: "mercado_pago",
      email: "test@example.com",
      phoneNumber: null,
      username: null,
      currency: "ARS",
      balance: "5000",
      linkedBankAccountId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockMessage = null;
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      render(
        <TransactionForm
          accounts={mockAccounts}
          goals={mockGoals}
          bankAccounts={mockBankAccounts}
          digitalWallets={mockDigitalWallets}
        />,
      );

      // Check main sections
      expect(screen.getByText("Nueva transaccion")).toBeInTheDocument();
      expect(screen.getByText("Tipo de movimiento")).toBeInTheDocument();
      expect(screen.getByText("Metodo")).toBeInTheDocument();

      // Check type buttons
      expect(
        screen.getByRole("button", { name: /gasto/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /ingreso/i }),
      ).toBeInTheDocument();

      // Check method buttons
      expect(
        screen.getByRole("button", { name: /efectivo/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /transferencia/i }),
      ).toBeInTheDocument();

      // Check amount input
      expect(screen.getByLabelText(/monto/i)).toBeInTheDocument();

      // Check currency field
      expect(screen.getByLabelText(/moneda/i)).toBeInTheDocument();

      // Check submit button
      expect(
        screen.getByRole("button", { name: /agregar transaccion/i }),
      ).toBeInTheDocument();
    });

    it("should hide header when showHeader is false", () => {
      render(
        <TransactionForm
          accounts={mockAccounts}
          goals={mockGoals}
          showHeader={false}
        />,
      );

      expect(screen.queryByText("Nueva transaccion")).not.toBeInTheDocument();
    });

    it("should apply dialog variant styles", () => {
      const { container } = render(
        <TransactionForm
          accounts={mockAccounts}
          goals={mockGoals}
          variant="dialog"
        />,
      );

      const containerDiv = container.firstChild as HTMLElement;
      expect(containerDiv.className).toContain("containerDialog");
    });
  });

  describe("Type Selection", () => {
    it("should switch from expense to income", async () => {
      const user = userEvent.setup();
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const gastoButton = screen.getByRole("button", { name: /gasto/i });
      const ingresoButton = screen.getByRole("button", { name: /ingreso/i });

      // Initially expense should be active
      expect(gastoButton).toHaveAttribute("aria-pressed", "true");
      expect(ingresoButton).toHaveAttribute("aria-pressed", "false");

      // Click income
      await user.click(ingresoButton);

      // Now income should be active
      expect(gastoButton).toHaveAttribute("aria-pressed", "false");
      expect(ingresoButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Flow Method Selection", () => {
    it("should switch from cash to transfer", async () => {
      const user = userEvent.setup();
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const efectivoButton = screen.getByRole("button", { name: /efectivo/i });
      const transferenciaButton = screen.getByRole("button", {
        name: /transferencia/i,
      });

      // Initially cash should be active
      expect(efectivoButton).toHaveAttribute("aria-pressed", "true");
      expect(transferenciaButton).toHaveAttribute("aria-pressed", "false");

      // Click transfer
      await user.click(transferenciaButton);

      // Now transfer should be active
      expect(efectivoButton).toHaveAttribute("aria-pressed", "false");
      expect(transferenciaButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Amount Input", () => {
    it("should format amount with thousands separator", async () => {
      const user = userEvent.setup();
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const amountInput = screen.getByLabelText(/monto/i) as HTMLInputElement;

      // Type a large number
      await user.type(amountInput, "1234567");

      // Should be formatted with dots
      expect(amountInput.value).toBe("1.234.567");
    });

    it("should handle decimal input with comma", async () => {
      const user = userEvent.setup();
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const amountInput = screen.getByLabelText(/monto/i) as HTMLInputElement;

      // Type number with comma for decimal
      await user.type(amountInput, "100,50");

      // Should show formatted
      expect(amountInput.value).toBe("100,50");
    });
  });

  describe("Currency Selection", () => {
    it("should open currency dropdown when clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const currencyButton = screen.getByLabelText(/moneda/i);
      await user.click(currencyButton);

      // Dropdown should be open with options
      await waitFor(() => {
        expect(screen.getByText("Pesos argentinos")).toBeInTheDocument();
      });
      expect(screen.getByText("Dolar estadounidense")).toBeInTheDocument();
      expect(screen.getByText("Euro")).toBeInTheDocument();
    });

    it("should select different currency", async () => {
      const user = userEvent.setup();
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      // Open dropdown
      const currencyButton = screen.getByLabelText(/moneda/i);
      await user.click(currencyButton);

      // Select USD - wait for dropdown to appear and find the option
      const usdOption = await screen.findByRole("option", {
        name: /USD.*Dolar estadounidense/i,
      });
      await user.click(usdOption);

      // Currency should change
      await waitFor(() => {
        const currencyButton = screen.getByLabelText(/moneda/i);
        expect(currencyButton).toHaveTextContent("USD");
      });
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup();
      const mockTransaction = {
        id: "trans-1",
        userId: "user-1",
        type: "expense",
        category: "food",
        amount: "100.00",
        description: "Almuerzo",
        date: new Date(),
        currency: "ARS",
        state: "CONFIRMED",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createTransactionWithAutoDetection).mockResolvedValue(
        ok(mockTransaction as any),
      );

      const onSuccess = vi.fn();

      render(
        <TransactionForm
          accounts={mockAccounts}
          goals={mockGoals}
          onSuccess={onSuccess}
        />,
      );

      // Fill form
      const amountInput = screen.getByLabelText(/monto/i);
      await user.type(amountInput, "100");

      const descriptionInput = screen.getByLabelText(/detalle/i);
      await user.type(descriptionInput, "Almuerzo");

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /agregar transaccion/i,
      });
      await user.click(submitButton);

      // Wait for success
      await waitFor(() => {
        expect(createTransactionWithAutoDetection).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
        expect(mockShowSuccess).toHaveBeenCalledWith(
          "Transaccion creada correctamente",
        );
      });
    });

    it("should show error when amount is empty", async () => {
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      // Submit without amount by directly submitting the form (bypassing HTML5 validation)
      const form = document.getElementById("transaction-form")!;
      fireEvent.submit(form);

      // Error message should be shown via useMessage hook
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith("Ingresa un monto valido");
      });

      // Server action should not be called
      expect(createTransactionWithAutoDetection).not.toHaveBeenCalled();
    });

    it("should show error when amount is invalid", async () => {
      const user = userEvent.setup();
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const amountInput = screen.getByLabelText(/monto/i);
      await user.type(amountInput, "abc");

      // Submit by directly submitting the form (bypassing HTML5 validation)
      const form = document.getElementById("transaction-form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith("Ingresa un monto valido");
      });
    });

    it("should show error from server action", async () => {
      const user = userEvent.setup();

      vi.mocked(createTransactionWithAutoDetection).mockResolvedValue(
        err(validationError("amount", "El monto es requerido")),
      );

      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const amountInput = screen.getByLabelText(/monto/i);
      await user.type(amountInput, "100");

      const submitButton = screen.getByRole("button", {
        name: /agregar transaccion/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith("El monto es requerido");
      });
    });

    it("should reset form after successful submission", async () => {
      const user = userEvent.setup();

      vi.mocked(createTransactionWithAutoDetection).mockResolvedValue(
        ok({
          id: "trans-1",
          amount: "100.00",
        } as any),
      );

      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const amountInput = screen.getByLabelText(/monto/i) as HTMLInputElement;
      await user.type(amountInput, "100");

      const descriptionInput = screen.getByLabelText(
        /detalle/i,
      ) as HTMLInputElement;
      await user.type(descriptionInput, "Test");

      const submitButton = screen.getByRole("button", {
        name: /agregar transaccion/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(amountInput.value).toBe("");
        expect(descriptionInput.value).toBe("");
      });
    });
  });

  describe("Currency Mismatch Validation", () => {
    it("should show error when source currency doesn't match selected currency", async () => {
      const user = userEvent.setup();
      render(
        <TransactionForm
          accounts={mockAccounts}
          goals={mockGoals}
          bankAccounts={mockBankAccounts}
        />,
      );

      // Select a source account with ARS currency
      const fromSelect = screen.getByLabelText(/desde \(banco\)/i);
      await user.selectOptions(fromSelect, "bank-1");

      // Change currency to USD
      const currencyButton = screen.getByLabelText(/moneda/i);
      await user.click(currencyButton);

      // Wait for dropdown and select USD
      const usdOption = await screen.findByRole("option", {
        name: /USD.*Dolar estadounidense/i,
      });
      await user.click(usdOption);

      // Add amount
      const amountInput = screen.getByLabelText(/monto/i);
      await user.type(amountInput, "100");

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /agregar transaccion/i,
      });
      await user.click(submitButton);

      // Should show currency mismatch error
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining("La moneda seleccionada no coincide"),
        );
      });
    });
  });

  describe("Insufficient Funds Validation", () => {
    it("should show warning when amount exceeds account balance", async () => {
      const user = userEvent.setup();

      // Create account with low balance
      const lowBalanceAccount: Account = {
        ...mockAccounts[0],
        balance: "50",
      };

      render(
        <TransactionForm accounts={[lowBalanceAccount]} goals={mockGoals} />,
      );

      // Select the low balance account
      const fromSelect = screen.getByLabelText(/desde \(cuenta\)/i);
      await user.selectOptions(fromSelect, lowBalanceAccount.id);

      // Add amount greater than balance
      const amountInput = screen.getByLabelText(/monto/i);
      await user.type(amountInput, "100");

      // Warning should appear
      await waitFor(() => {
        expect(screen.getByText(/fondos insuficientes/i)).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      // Mock a slow response
      vi.mocked(createTransactionWithAutoDetection).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(ok({ id: "trans-1" } as any)), 100),
          ),
      );

      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const amountInput = screen.getByLabelText(/monto/i);
      await user.type(amountInput, "100");

      const submitButton = screen.getByRole("button", {
        name: /agregar transaccion/i,
      });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(
        () => {
          expect(submitButton).not.toBeDisabled();
        },
        { timeout: 200 },
      );
    });
  });

  describe("Account Selection", () => {
    it("should show account balance when source is selected", async () => {
      const user = userEvent.setup();
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const fromSelect = screen.getByLabelText(/desde \(cuenta\)/i);
      await user.selectOptions(fromSelect, "acc-1");

      // Account should be selected
      expect((fromSelect as HTMLSelectElement).value).toBe("acc-1");
    });
  });

  describe("Date Field", () => {
    it("should have default date set to today", () => {
      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const dateInput = screen.getByLabelText(/fecha/i) as HTMLInputElement;
      const today = new Date().toISOString().split("T")[0];

      expect(dateInput.value).toBe(today);
    });
  });

  describe("Description Field", () => {
    it("should use category as fallback when description is empty", async () => {
      const user = userEvent.setup();

      vi.mocked(createTransactionWithAutoDetection).mockResolvedValue(
        ok({ id: "trans-1" } as any),
      );

      render(<TransactionForm accounts={mockAccounts} goals={mockGoals} />);

      const amountInput = screen.getByLabelText(/monto/i);
      await user.type(amountInput, "100");

      // Don't fill description
      const submitButton = screen.getByRole("button", {
        name: /agregar transaccion/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createTransactionWithAutoDetection).toHaveBeenCalledWith(
          expect.objectContaining({
            description: expect.any(String),
          }),
        );
      });
    });
  });
});
