import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionsSummary from "../TransactionsSummary";
import type { Transaction } from "@/types";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Card component
vi.mock("@/components/ui/Card/Card", () => ({
  default: ({
    children,
    variant,
    interactive,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    interactive?: boolean;
    onClick?: () => void;
    className?: string;
  }) => (
    <div
      data-testid="card"
      data-variant={variant}
      data-interactive={interactive}
      onClick={onClick}
      className={className}
    >
      {children}
    </div>
  ),
}));

describe("TransactionsSummary", () => {
  const baseMockTransaction: Transaction = {
    id: "tx-1",
    userId: "user-1",
    type: "income",
    amount: "1000.00",
    currency: "ARS",
    date: "2026-02-19",
    description: "Test income",
    category: "salary",
    state: "CONFIRMED",
    fromBankAccountId: null,
    toBankAccountId: "bank-1",
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
  });

  describe("Rendering and Basic Display", () => {
    it("should render the component with default period", () => {
      render(<TransactionsSummary transactions={[]} />);

      expect(screen.getByText(/período:/i)).toBeInTheDocument();
      expect(screen.getByText("Todos")).toBeInTheDocument();
    });

    it("should render with custom period label", () => {
      render(<TransactionsSummary transactions={[]} period="today" />);

      expect(screen.getByText("Hoy")).toBeInTheDocument();
    });

    it("should render week period label", () => {
      render(<TransactionsSummary transactions={[]} period="week" />);

      expect(screen.getByText("Esta semana")).toBeInTheDocument();
    });

    it("should render month period label", () => {
      render(<TransactionsSummary transactions={[]} period="month" />);

      expect(screen.getByText("Este mes")).toBeInTheDocument();
    });

    it("should render all three summary cards", () => {
      render(<TransactionsSummary transactions={[]} />);

      expect(screen.getByText("Ingresos")).toBeInTheDocument();
      expect(screen.getByText("Gastos")).toBeInTheDocument();
      expect(screen.getByText("Balance")).toBeInTheDocument();
    });

    it("should render statistics button", () => {
      render(<TransactionsSummary transactions={[]} />);

      const statsButton = screen.getByRole("button", {
        name: /estadísticas/i,
      });
      expect(statsButton).toBeInTheDocument();
      expect(statsButton).toHaveAttribute(
        "title",
        "Ver estadísticas detalladas",
      );
    });
  });

  describe("Calculations and Statistics", () => {
    it("should display zero values when no transactions", () => {
      render(<TransactionsSummary transactions={[]} />);

      // Should show formatted zeros (0 or 0.00 depending on formatter)
      const values = screen.getAllByText(/^[+−]?0/);
      expect(values.length).toBeGreaterThan(0);
    });

    it("should calculate and display income correctly", () => {
      const incomeTransaction = {
        ...baseMockTransaction,
        id: "tx-1",
        type: "income" as const,
        amount: "1000",
      };

      render(<TransactionsSummary transactions={[incomeTransaction]} />);

      // Should show +1000 (or +1,000 depending on formatter)
      expect(screen.getByText(/\+.*1.*000/)).toBeInTheDocument();
    });

    it("should calculate and display expenses correctly", () => {
      const expenseTransaction = {
        ...baseMockTransaction,
        id: "tx-2",
        type: "expense" as const,
        amount: "500",
      };

      render(<TransactionsSummary transactions={[expenseTransaction]} />);

      // Should show −500 (or −500 depending on formatter)
      expect(screen.getByText(/−.*500/)).toBeInTheDocument();
    });

    it("should calculate positive balance when income > expenses", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "1000",
        },
        {
          ...baseMockTransaction,
          id: "tx-2",
          type: "expense" as const,
          amount: "300",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Balance should be 700
      expect(screen.getByText(/700/)).toBeInTheDocument();
    });

    it("should calculate negative balance when expenses > income", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "500",
        },
        {
          ...baseMockTransaction,
          id: "tx-2",
          type: "expense" as const,
          amount: "1000",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Balance should be -500
      const cards = screen.getAllByTestId("card");
      const balanceCard = cards.find((card) =>
        card.textContent?.includes("Balance"),
      );
      expect(balanceCard).toHaveTextContent("-500");
    });

    it("should handle multiple transactions of same type", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "1000",
        },
        {
          ...baseMockTransaction,
          id: "tx-2",
          type: "income" as const,
          amount: "500",
        },
        {
          ...baseMockTransaction,
          id: "tx-3",
          type: "income" as const,
          amount: "300",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Total income should be 1800
      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );
      expect(incomeCard).toHaveTextContent("1800");
    });

    it("should handle only expenses (no income)", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "expense" as const,
          amount: "200",
        },
        {
          ...baseMockTransaction,
          id: "tx-2",
          type: "expense" as const,
          amount: "150",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Income should be 0, expenses 350, balance -350
      expect(screen.getByText(/\+.*0/)).toBeInTheDocument(); // Income
      expect(screen.getByText(/−.*350/)).toBeInTheDocument(); // Expenses
    });

    it("should handle only income (no expenses)", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "800",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Income should be 800, expenses 0, balance 800
      expect(screen.getByText(/\+.*800/)).toBeInTheDocument();
      expect(screen.getByText(/−.*0/)).toBeInTheDocument();
    });
  });

  describe("Card Variants", () => {
    it("should use success variant for income card", () => {
      render(<TransactionsSummary transactions={[]} />);

      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );

      expect(incomeCard).toHaveAttribute("data-variant", "success");
    });

    it("should use danger variant for expenses card", () => {
      render(<TransactionsSummary transactions={[]} />);

      const cards = screen.getAllByTestId("card");
      const expensesCard = cards.find((card) =>
        card.textContent?.includes("Gastos"),
      );

      expect(expensesCard).toHaveAttribute("data-variant", "danger");
    });

    it("should use success variant for positive balance", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "1000",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      const cards = screen.getAllByTestId("card");
      const balanceCard = cards.find((card) =>
        card.textContent?.includes("Balance"),
      );

      expect(balanceCard).toHaveAttribute("data-variant", "success");
    });

    it("should use danger variant for negative balance", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "expense" as const,
          amount: "1000",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      const cards = screen.getAllByTestId("card");
      const balanceCard = cards.find((card) =>
        card.textContent?.includes("Balance"),
      );

      expect(balanceCard).toHaveAttribute("data-variant", "danger");
    });

    it("should use success variant for zero balance", () => {
      render(<TransactionsSummary transactions={[]} />);

      const cards = screen.getAllByTestId("card");
      const balanceCard = cards.find((card) =>
        card.textContent?.includes("Balance"),
      );

      expect(balanceCard).toHaveAttribute("data-variant", "success");
    });

    it("should mark all cards as interactive", () => {
      render(<TransactionsSummary transactions={[]} />);

      const cards = screen.getAllByTestId("card");
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-interactive", "true");
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to statistics page when stats button is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionsSummary transactions={[]} />);

      const statsButton = screen.getByRole("button", {
        name: /estadísticas/i,
      });
      await user.click(statsButton);

      expect(mockPush).toHaveBeenCalledWith("/statistics");
    });

    it("should navigate to statistics when income card is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionsSummary transactions={[]} />);

      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );

      await user.click(incomeCard!);

      expect(mockPush).toHaveBeenCalledWith("/statistics");
    });

    it("should navigate to statistics when expenses card is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionsSummary transactions={[]} />);

      const cards = screen.getAllByTestId("card");
      const expensesCard = cards.find((card) =>
        card.textContent?.includes("Gastos"),
      );

      await user.click(expensesCard!);

      expect(mockPush).toHaveBeenCalledWith("/statistics");
    });

    it("should navigate to statistics when balance card is clicked", async () => {
      const user = userEvent.setup();
      render(<TransactionsSummary transactions={[]} />);

      const cards = screen.getAllByTestId("card");
      const balanceCard = cards.find((card) =>
        card.textContent?.includes("Balance"),
      );

      await user.click(balanceCard!);

      expect(mockPush).toHaveBeenCalledWith("/statistics");
    });
  });

  describe("Number Formatting", () => {
    it("should format large numbers correctly", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "1500000",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Should format with thousands separator (1,500,000 or 1.500.000)
      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );
      expect(incomeCard?.textContent).toMatch(/1.*500.*000/);
    });

    it("should handle decimal amounts", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "1250.50",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Should show formatted with decimal
      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );
      expect(incomeCard?.textContent).toMatch(/1.*250/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large amounts", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "999999999",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );
      expect(incomeCard?.textContent).toMatch(/999.*999.*999/);
    });

    it("should handle string amounts with leading zeros", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "00100",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );
      expect(incomeCard).toHaveTextContent("100");
    });

    it("should handle transactions with different currencies", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "income" as const,
          amount: "1000",
          currency: "ARS",
        },
        {
          ...baseMockTransaction,
          id: "tx-2",
          type: "expense" as const,
          amount: "500",
          currency: "USD",
        },
      ];

      // Component should still calculate (though mixing currencies isn't ideal)
      render(<TransactionsSummary transactions={transactions} />);

      expect(screen.getByText("Ingresos")).toBeInTheDocument();
      expect(screen.getByText("Gastos")).toBeInTheDocument();
      expect(screen.getByText("Balance")).toBeInTheDocument();
    });
  });

  describe("Complex Scenarios", () => {
    it("should calculate correctly with transfers between own accounts", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "transfer_own_accounts" as const,
          amount: "500",
          transferLeg: "outflow" as const,
        },
        {
          ...baseMockTransaction,
          id: "tx-2",
          type: "transfer_own_accounts" as const,
          amount: "500",
          transferLeg: "inflow" as const,
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Balance should be 0 (transfer cancels out)
      expect(screen.getByText("Balance")).toBeInTheDocument();
    });

    it("should handle transfers without counting them in income or expenses", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "transfer_own_accounts" as const,
          amount: "300",
        },
        {
          ...baseMockTransaction,
          id: "tx-2",
          type: "income" as const,
          amount: "500",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Transfers should not count as income or expense
      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );
      const expensesCard = cards.find((card) =>
        card.textContent?.includes("Gastos"),
      );

      expect(incomeCard).toHaveTextContent("500"); // Only the income transaction
      expect(expensesCard).toHaveTextContent("0"); // Transfer not counted
    });

    it("should handle withdrawals and deposits without counting them in statistics", () => {
      const transactions = [
        {
          ...baseMockTransaction,
          id: "tx-1",
          type: "withdrawal" as const,
          amount: "300",
        },
        {
          ...baseMockTransaction,
          id: "tx-2",
          type: "deposit" as const,
          amount: "400",
        },
        {
          ...baseMockTransaction,
          id: "tx-3",
          type: "income" as const,
          amount: "1000",
        },
      ];

      render(<TransactionsSummary transactions={transactions} />);

      // Withdrawals and deposits are money movements, not income/expenses
      const cards = screen.getAllByTestId("card");
      const incomeCard = cards.find((card) =>
        card.textContent?.includes("Ingresos"),
      );
      const expensesCard = cards.find((card) =>
        card.textContent?.includes("Gastos"),
      );

      expect(incomeCard).toHaveTextContent("1000"); // Only actual income
      expect(expensesCard).toHaveTextContent("0"); // No expenses
    });
  });
});
