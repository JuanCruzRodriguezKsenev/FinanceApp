import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TransactionStatusBadge from "../TransactionStatusBadge";
import type { TransactionState } from "@/types";

describe("TransactionStatusBadge", () => {
  it("renders DRAFT state correctly", () => {
    render(<TransactionStatusBadge state="DRAFT" as TransactionState />);
    expect(screen.getByText("Borrador")).toBeInTheDocument();
  });

  it("renders PENDING state correctly", () => {
    render(<TransactionStatusBadge state="PENDING" as TransactionState />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("renders CONFIRMED state correctly", () => {
    render(<TransactionStatusBadge state="CONFIRMED" as TransactionState />);
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
  });

  it("renders FAILED state correctly", () => {
    render(<TransactionStatusBadge state="FAILED" as TransactionState />);
    expect(screen.getByText("Fallida")).toBeInTheDocument();
  });

  it("renders CANCELLED state correctly", () => {
    render(<TransactionStatusBadge state="CANCELLED" as TransactionState />);
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it("renders RECONCILED state correctly", () => {
    render(<TransactionStatusBadge state="RECONCILED" as TransactionState />);
    expect(screen.getByText("Conciliada")).toBeInTheDocument();
  });

  it("applies correct CSS classes for each state", () => {
    const states: TransactionState[] = [
      "DRAFT",
      "PENDING",
      "CONFIRMED",
      "FAILED",
      "CANCELLED",
      "RECONCILED",
    ];

    states.forEach((state) => {
      const { container } = render(<TransactionStatusBadge state={state} />);
      const badge = container.querySelector("span");
      expect(badge).toBeTruthy();
      expect(badge?.className).toContain("badge");
    });
  });
});
