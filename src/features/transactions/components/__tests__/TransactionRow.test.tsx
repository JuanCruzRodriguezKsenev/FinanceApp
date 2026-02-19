import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionRow from "../TransactionRow";
import {
  deleteTransaction,
  submitTransaction,
  confirmTransaction,
  rejectTransaction,
  cancelTransaction,
  reconcileTransaction,
} from "../../actions";
import type {
  Transaction,
  Account,
  BankAccount,
  DigitalWallet,
  Contact,
} from "@/types";
import { ok, err } from "@/lib/result";
import { networkError } from "@/lib/result/errors";

// Mock the server actions
vi.mock("../../actions", () => ({
  deleteTransaction: vi.fn(),
  submitTransaction: vi.fn(),
  confirmTransaction: vi.fn(),
  rejectTransaction: vi.fn(),
  cancelTransaction: vi.fn(),
  reconcileTransaction: vi.fn(),
}));

// Mock TransactionStatusBadge
vi.mock("../TransactionStatusBadge", () => ({
  default: ({ state }: { state: string }) => (
    <div data-testid="status-badge">{state}</div>
  ),
}));

describe("TransactionRow", () => {
  const mockAccount: Account = {
    id: "acc-1",
    userId: "user-1",
    name: "Cuenta Principal",
    type: "bank",
    balance: "10000",
    currency: "ARS",
    color: null,
    icon: null,
    createdAt: new Date("2026-02-19"),
    updatedAt: new Date("2026-02-19"),
  } as Account;

  const mockBankAccount: BankAccount = {
    id: "bank-1",
    userId: "user-1",
    accountName: "Santander",
    bank: "santander",
    accountType: "checking",
    accountNumber: "123456",
    currency: "ARS",
    balance: "10000",
    ownerName: "Juan Perez",
    isActive: true,
    createdAt: new Date("2026-02-19"),
    updatedAt: new Date("2026-02-19"),
  } as BankAccount;

  const mockWallet: DigitalWallet = {
    id: "wallet-1",
    userId: "user-1",
    walletName: "MercadoPago",
    provider: "mercado_pago",
    currency: "ARS",
    balance: "5000",
    isActive: true,
    createdAt: new Date("2026-02-19"),
    updatedAt: new Date("2026-02-19"),
  } as DigitalWallet;

  const mockContact: Contact = {
    id: "contact-1",
    userId: "user-1",
    name: "Juan Pérez",
    displayName: "Juancito",
    email: "juan@example.com",
  } as Contact;

  const accountMap = new Map<string, Account>([[mockAccount.id, mockAccount]]);
  const bankAccountMap = new Map<string, BankAccount>([
    [mockBankAccount.id, mockBankAccount],
  ]);
  const walletMap = new Map<string, DigitalWallet>([
    [mockWallet.id, mockWallet],
  ]);
  const contactMap = new Map<string, Contact>([[mockContact.id, mockContact]]);

  const baseMockTransaction: Transaction = {
    id: "tx-1",
    userId: "user-1",
    type: "expense",
    amount: "100.00",
    currency: "ARS",
    date: new Date("2026-02-19"),
    description: "Test transaction",
    category: "food",
    state: "DRAFT",
    fromBankAccountId: mockBankAccount.id,
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
  } as Transaction;

  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
    global.alert = vi.fn();
  });

  describe("Rendering and Data Display", () => {
    it("should render transaction row with basic data", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByText("Test transaction")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("ARS")).toBeInTheDocument();
    });

    it("should format date correctly", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Check that date is displayed (format may vary based on locale)
      expect(screen.getByText(/19|02|2026/)).toBeInTheDocument();
    });

    it("should display transaction type label", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Type label should be displayed (Gasto for expense)
      expect(screen.getByText(/gasto/i)).toBeInTheDocument();
    });

    it("should display category label", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Category label should be displayed
      expect(screen.getByText(/comida/i)).toBeInTheDocument();
    });
  });

  describe("Account Resolution", () => {
    it("should display bank account name for fromBankAccountId", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByText("Santander")).toBeInTheDocument();
    });

    it("should display wallet name for fromWalletId", () => {
      const txWithWallet = {
        ...baseMockTransaction,
        fromBankAccountId: null,
        fromWalletId: mockWallet.id,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={txWithWallet}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByText("MercadoPago")).toBeInTheDocument();
    });

    it("should display transfer arrow when both from and to accounts exist", () => {
      const txTransfer = {
        ...baseMockTransaction,
        type: "transfer_own_accounts" as const,
        fromBankAccountId: mockBankAccount.id,
        toBankAccountId: "bank-2",
      };

      const bankMap = new Map(bankAccountMap);
      bankMap.set("bank-2", {
        id: "bank-2",
        accountName: "BBVA",
        bank: "bbva",
      } as BankAccount);

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={txTransfer}
                accountMap={accountMap}
                bankAccountMap={bankMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Should show "Santander → BBVA"
      expect(screen.getByText(/Santander.*→.*BBVA/)).toBeInTheDocument();
    });

    it("should display fallback text when account not found", () => {
      const txWithUnknownAccount = {
        ...baseMockTransaction,
        fromBankAccountId: "unknown-id",
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={txWithUnknownAccount}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByText("Cuenta bancaria")).toBeInTheDocument();
    });
  });

  describe("Contact Resolution", () => {
    it("should display contact displayName when available", () => {
      const txWithContact = {
        ...baseMockTransaction,
        contactId: mockContact.id,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={txWithContact}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByText("Juancito")).toBeInTheDocument();
    });

    it("should display transferRecipient when no contact", () => {
      const txWithRecipient = {
        ...baseMockTransaction,
        transferRecipient: "Maria García",
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={txWithRecipient}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByText("Maria García")).toBeInTheDocument();
    });

    it("should display fallback when no contact information", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Should show "—" for empty contact
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("Amount Formatting and Color", () => {
    it("should display negative amount with minus symbol for expense", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Should have minus symbol for outflow
      expect(screen.getByText("−")).toBeInTheDocument();
    });

    it("should display positive amount with plus symbol for income", () => {
      const incomeTransaction = {
        ...baseMockTransaction,
        type: "income" as const,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={incomeTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Should have plus symbol for inflow
      expect(screen.getByText("+")).toBeInTheDocument();
    });

    it("should display Salida for outflow leg", () => {
      const outflowTransaction = {
        ...baseMockTransaction,
        transferLeg: "outflow" as const,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={outflowTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByText("Salida")).toBeInTheDocument();
    });

    it("should display Entrada for inflow leg", () => {
      const inflowTransaction = {
        ...baseMockTransaction,
        type: "income" as const,
        transferLeg: "inflow" as const,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={inflowTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByText("Entrada")).toBeInTheDocument();
    });
  });

  describe("Transaction Badges", () => {
    it("should display transfer between own accounts badge", () => {
      const transferTransaction = {
        ...baseMockTransaction,
        isTransferBetweenOwnAccounts: true,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={transferTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const badge = screen.getByTitle("Transferencia Interna");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("🔄");
    });

    it("should display third party transfer badge", () => {
      const thirdPartyTransaction = {
        ...baseMockTransaction,
        isTransferToThirdParty: true,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={thirdPartyTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const badge = screen.getByTitle("Pago a Tercero");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("👤");
    });

    it("should display cash withdrawal badge", () => {
      const withdrawalTransaction = {
        ...baseMockTransaction,
        isCashWithdrawal: true,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={withdrawalTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const badge = screen.getByTitle("Retiro de Efectivo");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("💵");
    });

    it("should display cash deposit badge", () => {
      const depositTransaction = {
        ...baseMockTransaction,
        isCashDeposit: true,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={depositTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const badge = screen.getByTitle("Depósito de Efectivo");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("💰");
    });
  });

  describe("State-Based Actions", () => {
    it("should show Enviar and Cancelar buttons when state is DRAFT", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(
        screen.getByRole("button", { name: /enviar/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancelar/i }),
      ).toBeInTheDocument();
    });

    it("should show Confirmar, Rechazar, and Cancelar when state is PENDING", () => {
      const pendingTransaction = {
        ...baseMockTransaction,
        state: "PENDING" as const,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={pendingTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(
        screen.getByRole("button", { name: /confirmar/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /rechazar/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancelar/i }),
      ).toBeInTheDocument();
    });

    it("should show Conciliar button when state is CONFIRMED", () => {
      const confirmedTransaction = {
        ...baseMockTransaction,
        state: "CONFIRMED" as const,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={confirmedTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      expect(
        screen.getByRole("button", { name: /conciliar/i }),
      ).toBeInTheDocument();
    });

    it("should not show action buttons when state is RECONCILED", () => {
      const reconciledTransaction = {
        ...baseMockTransaction,
        state: "RECONCILED" as const,
      };

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={reconciledTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Should not have any state action buttons
      expect(
        screen.queryByRole("button", { name: /enviar/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /confirmar/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /conciliar/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Action Handlers", () => {
    it("should call submitTransaction when Enviar is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(submitTransaction).mockResolvedValue(
        ok({ id: "tx-1" } as Transaction),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const submitBtn = screen.getByRole("button", { name: /enviar/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(submitTransaction).toHaveBeenCalledWith("tx-1");
      });
    });

    it("should call confirmTransaction when Confirmar is clicked", async () => {
      const user = userEvent.setup();
      const pendingTransaction = {
        ...baseMockTransaction,
        state: "PENDING" as const,
      };
      vi.mocked(confirmTransaction).mockResolvedValue(
        ok({ id: "tx-1" } as Transaction),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={pendingTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const confirmBtn = screen.getByRole("button", { name: /confirmar/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(confirmTransaction).toHaveBeenCalledWith("tx-1");
      });
    });

    it("should call rejectTransaction when Rechazar is clicked", async () => {
      const user = userEvent.setup();
      const pendingTransaction = {
        ...baseMockTransaction,
        state: "PENDING" as const,
      };
      vi.mocked(rejectTransaction).mockResolvedValue(
        ok({ id: "tx-1" } as Transaction),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={pendingTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const rejectBtn = screen.getByRole("button", { name: /rechazar/i });
      await user.click(rejectBtn);

      await waitFor(() => {
        expect(rejectTransaction).toHaveBeenCalledWith("tx-1");
      });
    });

    it("should call cancelTransaction when Cancelar is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(cancelTransaction).mockResolvedValue(
        ok({ id: "tx-1" } as Transaction),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const cancelBtn = screen.getByRole("button", { name: /cancelar/i });
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(cancelTransaction).toHaveBeenCalledWith("tx-1");
      });
    });

    it("should call reconcileTransaction when Conciliar is clicked", async () => {
      const user = userEvent.setup();
      const confirmedTransaction = {
        ...baseMockTransaction,
        state: "CONFIRMED" as const,
      };
      vi.mocked(reconcileTransaction).mockResolvedValue(
        ok({ id: "tx-1" } as Transaction),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={confirmedTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const reconcileBtn = screen.getByRole("button", { name: /conciliar/i });
      await user.click(reconcileBtn);

      await waitFor(() => {
        expect(reconcileTransaction).toHaveBeenCalledWith("tx-1");
      });
    });

    it("should show alert when action fails", async () => {
      const user = userEvent.setup();
      vi.mocked(submitTransaction).mockResolvedValue(
        err(networkError("Error al enviar")),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const submitBtn = screen.getByRole("button", { name: /enviar/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith("No se pudo enviar");
      });
    });
  });

  describe("Delete Action", () => {
    it("should call deleteTransaction when delete button is clicked and confirmed", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteTransaction).mockResolvedValue(ok(undefined));

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const deleteBtn = screen.getByRole("button", { name: /✕/i });
      await user.click(deleteBtn);

      expect(global.confirm).toHaveBeenCalledWith(
        "¿Estás seguro de eliminar esta transacción?",
      );

      await waitFor(() => {
        expect(deleteTransaction).toHaveBeenCalledWith("tx-1");
      });
    });

    it("should not delete when user cancels confirmation", async () => {
      const user = userEvent.setup();
      global.confirm = vi.fn(() => false);

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const deleteBtn = screen.getByRole("button", { name: /✕/i });
      await user.click(deleteBtn);

      expect(deleteTransaction).not.toHaveBeenCalled();
    });

    it("should show alert when delete fails", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteTransaction).mockResolvedValue(
        err(networkError("Cannot delete")),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const deleteBtn = screen.getByRole("button", { name: /✕/i });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          "No se pudo eliminar la transacción",
        );
      });
    });
  });

  describe("Loading States", () => {
    it("should disable buttons during action execution", async () => {
      const user = userEvent.setup();
      // Make submitTransaction hang to keep pending state
      vi.mocked(submitTransaction).mockImplementation(
        () => new Promise(() => {}),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const submitBtn = screen.getByRole("button", { name: /enviar/i });
      const cancelBtn = screen.getByRole("button", { name: /cancelar/i });
      const deleteBtn = screen.getByRole("button", { name: /✕/i });

      await user.click(submitBtn);

      // After click, buttons should be disabled
      await waitFor(() => {
        expect(submitBtn).toBeDisabled();
        expect(cancelBtn).toBeDisabled();
        expect(deleteBtn).toBeDisabled();
      });
    });

    it("should show loading indicator on delete button during deletion", async () => {
      const user = userEvent.setup();
      // Make deleteTransaction hang
      vi.mocked(deleteTransaction).mockImplementation(
        () => new Promise(() => {}),
      );

      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const deleteBtn = screen.getByRole("button", { name: /✕/i });
      await user.click(deleteBtn);

      // Should show loading icon
      await waitFor(() => {
        expect(screen.getByText("⏳")).toBeInTheDocument();
      });
    });
  });

  describe("Status Badge", () => {
    it("should render TransactionStatusBadge with transaction state", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TransactionRow
                transaction={baseMockTransaction}
                accountMap={accountMap}
                bankAccountMap={bankAccountMap}
                walletMap={walletMap}
                contactMap={contactMap}
              />
            </tr>
          </tbody>
        </table>,
      );

      const badge = screen.getByTestId("status-badge");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("DRAFT");
    });
  });
});
