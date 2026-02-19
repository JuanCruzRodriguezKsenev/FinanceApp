import { describe, it, expect, beforeEach } from "vitest";
import {
  TransactionStateMachine,
  type TransactionStateContext,
} from "../transaction.service";
import { TransactionState } from "../transaction.machine";

describe("TransactionStateMachine Service", () => {
  describe("Constructor and Initial State", () => {
    it("initializes with default DRAFT state", () => {
      const fsm = new TransactionStateMachine();
      expect(fsm.getState()).toBe(TransactionState.DRAFT);
    });

    it("initializes with provided state", () => {
      const fsm = new TransactionStateMachine(TransactionState.PENDING);
      expect(fsm.getState()).toBe(TransactionState.PENDING);
    });

    it("initializes with empty context by default", () => {
      const fsm = new TransactionStateMachine();
      expect(fsm.getContext()).toEqual({});
    });

    it("initializes with provided context", () => {
      const context: TransactionStateContext = {
        bankReference: "REF123",
        submittedAt: "2024-01-01T00:00:00Z",
      };
      const fsm = new TransactionStateMachine(
        TransactionState.PENDING,
        context,
      );
      expect(fsm.getContext()).toEqual(context);
    });
  });

  describe("State Transitions", () => {
    let fsm: TransactionStateMachine;

    beforeEach(() => {
      fsm = new TransactionStateMachine();
    });

    it("transitions from DRAFT to PENDING on SUBMIT", () => {
      expect(fsm.canTransition("SUBMIT")).toBe(true);
      fsm.send("SUBMIT");
      expect(fsm.getState()).toBe(TransactionState.PENDING);
    });

    it("transitions from PENDING to CONFIRMED on CONFIRM", () => {
      fsm.send("SUBMIT"); // DRAFT → PENDING
      expect(fsm.canTransition("CONFIRM")).toBe(true);
      fsm.send("CONFIRM");
      expect(fsm.getState()).toBe(TransactionState.CONFIRMED);
    });

    it("transitions from PENDING to FAILED on REJECT", () => {
      fsm.send("SUBMIT"); // DRAFT → PENDING
      expect(fsm.canTransition("REJECT")).toBe(true);
      fsm.send("REJECT");
      expect(fsm.getState()).toBe(TransactionState.FAILED);
    });

    it("transitions from CONFIRMED to RECONCILED on RECONCILE", () => {
      fsm.send("SUBMIT"); // DRAFT → PENDING
      fsm.send("CONFIRM"); // PENDING → CONFIRMED
      expect(fsm.canTransition("RECONCILE")).toBe(true);
      fsm.send("RECONCILE");
      expect(fsm.getState()).toBe(TransactionState.RECONCILED);
    });

    it("transitions from DRAFT to CANCELLED on CANCEL", () => {
      expect(fsm.canTransition("CANCEL")).toBe(true);
      fsm.send("CANCEL");
      expect(fsm.getState()).toBe(TransactionState.CANCELLED);
    });

    it("transitions from PENDING to CANCELLED on CANCEL", () => {
      fsm.send("SUBMIT"); // DRAFT → PENDING
      expect(fsm.canTransition("CANCEL")).toBe(true);
      fsm.send("CANCEL");
      expect(fsm.getState()).toBe(TransactionState.CANCELLED);
    });
  });

  describe("Invalid Transitions", () => {
    let fsm: TransactionStateMachine;

    beforeEach(() => {
      fsm = new TransactionStateMachine();
    });

    it("rejects CONFIRM from DRAFT state", () => {
      expect(fsm.canTransition("CONFIRM")).toBe(false);
      const initialState = fsm.getState();
      fsm.send("CONFIRM"); // Should do nothing
      expect(fsm.getState()).toBe(initialState); // State unchanged
    });

    it("rejects SUBMIT from PENDING state", () => {
      fsm.send("SUBMIT"); // DRAFT → PENDING
      expect(fsm.canTransition("SUBMIT")).toBe(false);
      fsm.send("SUBMIT"); // Should do nothing
      expect(fsm.getState()).toBe(TransactionState.PENDING); // State unchanged
    });

    it("rejects RECONCILE from PENDING state", () => {
      fsm.send("SUBMIT"); // DRAFT → PENDING
      expect(fsm.canTransition("RECONCILE")).toBe(false);
      fsm.send("RECONCILE"); // Should do nothing
      expect(fsm.getState()).toBe(TransactionState.PENDING); // State unchanged
    });

    it("rejects all events from RECONCILED state", () => {
      // Reach RECONCILED state
      fsm.send("SUBMIT"); // DRAFT → PENDING
      fsm.send("CONFIRM"); // PENDING → CONFIRMED
      fsm.send("RECONCILE"); // CONFIRMED → RECONCILED

      // Try all events
      expect(fsm.canTransition("SUBMIT")).toBe(false);
      expect(fsm.canTransition("CONFIRM")).toBe(false);
      expect(fsm.canTransition("REJECT")).toBe(false);
      expect(fsm.canTransition("CANCEL")).toBe(false);
      expect(fsm.canTransition("RECONCILE")).toBe(false);

      // State should remain RECONCILED
      expect(fsm.getState()).toBe(TransactionState.RECONCILED);
    });

    it("rejects all events from CANCELLED state", () => {
      fsm.send("CANCEL"); // DRAFT → CANCELLED

      // Try all events
      expect(fsm.canTransition("SUBMIT")).toBe(false);
      expect(fsm.canTransition("CONFIRM")).toBe(false);
      expect(fsm.canTransition("REJECT")).toBe(false);
      expect(fsm.canTransition("CANCEL")).toBe(false);
      expect(fsm.canTransition("RECONCILE")).toBe(false);

      // State should remain CANCELLED
      expect(fsm.getState()).toBe(TransactionState.CANCELLED);
    });
  });

  describe("Context Management", () => {
    it("preserves context data when transitioning", () => {
      const fsm = new TransactionStateMachine(TransactionState.DRAFT, {
        initialData: "test",
      });
      fsm.send("SUBMIT", { submittedAt: "2024-01-01" });
      const context = fsm.getContext();
      expect(context.initialData).toBe("test");
      expect(context.submittedAt).toBe("2024-01-01");
    });

    it("merges new context data with existing context", () => {
      const fsm = new TransactionStateMachine();
      fsm.send("SUBMIT", { submittedAt: "2024-01-01" });
      fsm.send("CONFIRM", { confirmedAt: "2024-01-02" });
      const context = fsm.getContext();
      expect(context.submittedAt).toBe("2024-01-01");
      expect(context.confirmedAt).toBe("2024-01-02");
    });

    it("overwrites context properties with same key", () => {
      const fsm = new TransactionStateMachine();
      fsm.send("SUBMIT", { timestamp: "2024-01-01" });
      fsm.send("CONFIRM", { timestamp: "2024-01-02" });
      const context = fsm.getContext();
      expect(context.timestamp).toBe("2024-01-02");
    });

    it("returns a copy of context to prevent external mutations", () => {
      const fsm = new TransactionStateMachine();
      fsm.send("SUBMIT", { data: "original" });
      const context1 = fsm.getContext();
      context1.data = "modified";
      const context2 = fsm.getContext();
      expect(context2.data).toBe("original");
    });

    it("allows transitioning without providing context data", () => {
      const fsm = new TransactionStateMachine();
      fsm.send("SUBMIT"); // No context provided
      expect(fsm.getState()).toBe(TransactionState.PENDING);
      expect(fsm.getContext()).toEqual({});
    });
  });

  describe("Complete Transaction Flows", () => {
    it("executes happy path: DRAFT → PENDING → CONFIRMED → RECONCILED", () => {
      const fsm = new TransactionStateMachine();

      // DRAFT → PENDING
      fsm.send("SUBMIT", { submittedAt: "2024-01-01" });
      expect(fsm.getState()).toBe(TransactionState.PENDING);

      // PENDING → CONFIRMED
      fsm.send("CONFIRM", { confirmedAt: "2024-01-02" });
      expect(fsm.getState()).toBe(TransactionState.CONFIRMED);

      // CONFIRMED → RECONCILED
      fsm.send("RECONCILE", { reconciledAt: "2024-01-03" });
      expect(fsm.getState()).toBe(TransactionState.RECONCILED);

      const context = fsm.getContext();
      expect(context.submittedAt).toBe("2024-01-01");
      expect(context.confirmedAt).toBe("2024-01-02");
      expect(context.reconciledAt).toBe("2024-01-03");
    });

    it("executes failure path: DRAFT → PENDING → FAILED", () => {
      const fsm = new TransactionStateMachine();

      fsm.send("SUBMIT", { submittedAt: "2024-01-01" });
      expect(fsm.getState()).toBe(TransactionState.PENDING);

      fsm.send("REJECT", {
        rejectedAt: "2024-01-02",
        reason: "Insufficient funds",
      });
      expect(fsm.getState()).toBe(TransactionState.FAILED);

      const context = fsm.getContext();
      expect(context.reason).toBe("Insufficient funds");
    });

    it("executes early cancellation: DRAFT → CANCELLED", () => {
      const fsm = new TransactionStateMachine();

      fsm.send("CANCEL", { cancelledAt: "2024-01-01" });
      expect(fsm.getState()).toBe(TransactionState.CANCELLED);
    });

    it("executes mid-flow cancellation: PENDING → CANCELLED", () => {
      const fsm = new TransactionStateMachine();

      fsm.send("SUBMIT", { submittedAt: "2024-01-01" });
      fsm.send("CANCEL", {
        cancelledAt: "2024-01-02",
        reason: "User requested cancellation",
      });
      expect(fsm.getState()).toBe(TransactionState.CANCELLED);

      const context = fsm.getContext();
      expect(context.submittedAt).toBe("2024-01-01");
      expect(context.cancelledAt).toBe("2024-01-02");
    });
  });

  describe("State Immutability", () => {
    it("does not modify state on invalid transitions", () => {
      const fsm = new TransactionStateMachine(TransactionState.PENDING);
      const originalState = fsm.getState();

      // Try invalid transition
      fsm.send("SUBMIT");

      expect(fsm.getState()).toBe(originalState);
    });

    it("does not modify context on invalid transitions", () => {
      const fsm = new TransactionStateMachine(TransactionState.PENDING, {
        data: "original",
      });
      const originalContext = fsm.getContext();

      // Try invalid transition
      fsm.send("SUBMIT", { newData: "should not be added" });

      const currentContext = fsm.getContext();
      expect(currentContext).toEqual(originalContext);
      expect(currentContext.newData).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid successive valid transitions", () => {
      const fsm = new TransactionStateMachine();

      fsm.send("SUBMIT");
      fsm.send("CONFIRM");
      fsm.send("RECONCILE");

      expect(fsm.getState()).toBe(TransactionState.RECONCILED);
    });

    it("handles rapid successive invalid transitions", () => {
      const fsm = new TransactionStateMachine();

      fsm.send("CONFIRM"); // Invalid
      fsm.send("RECONCILE"); // Invalid
      fsm.send("REJECT"); // Invalid

      expect(fsm.getState()).toBe(TransactionState.DRAFT); // Unchanged
    });

    it("handles empty string context values", () => {
      const fsm = new TransactionStateMachine();
      fsm.send("SUBMIT", { note: "" });
      expect(fsm.getContext().note).toBe("");
    });

    it("handles null and undefined context values", () => {
      const fsm = new TransactionStateMachine();
      fsm.send("SUBMIT", {
        nullValue: null,
        undefinedValue: undefined,
      });
      const context = fsm.getContext();
      expect(context.nullValue).toBeNull();
      expect(context.undefinedValue).toBeUndefined();
    });

    it("handles complex nested objects in context", () => {
      const fsm = new TransactionStateMachine();
      fsm.send("SUBMIT", {
        metadata: {
          bank: { name: "Test Bank", code: "001" },
          amount: { currency: "USD", value: 100.5 },
        },
      });
      const context = fsm.getContext();
      expect(context.metadata).toBeDefined();
      expect((context.metadata as any).bank.name).toBe("Test Bank");
      expect((context.metadata as any).amount.value).toBe(100.5);
    });
  });
});
