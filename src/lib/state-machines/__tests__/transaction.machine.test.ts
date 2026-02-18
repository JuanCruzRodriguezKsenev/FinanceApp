import { describe, it, expect } from "vitest";
import {
  TransactionState,
  TransactionEventType,
  VALID_TRANSITIONS,
  EVENT_TO_STATE,
  canTransition,
  canTransitionEvent,
  getValidTransitions,
  getValidEvents,
} from "../transaction.machine";

describe("Transaction State Machine", () => {
  describe("State Definitions", () => {
    it("should have all 6 states defined", () => {
      const states = Object.keys(VALID_TRANSITIONS);
      expect(states).toHaveLength(6);
      expect(states).toContain("DRAFT");
      expect(states).toContain("PENDING");
      expect(states).toContain("CONFIRMED");
      expect(states).toContain("FAILED");
      expect(states).toContain("CANCELLED");
      expect(states).toContain("RECONCILED");
    });

    it("should have all events defined", () => {
      const events = Object.keys(EVENT_TO_STATE);
      expect(events).toContain("SUBMIT");
      expect(events).toContain("CONFIRM");
      expect(events).toContain("REJECT");
      expect(events).toContain("CANCEL");
      expect(events).toContain("RECONCILE");
    });
  });

  describe("Valid Transitions", () => {
    it("DRAFT can transition to PENDING", () => {
      expect(
        canTransition(TransactionState.DRAFT, TransactionState.PENDING),
      ).toBe(true);
    });

    it("DRAFT can transition to CANCELLED", () => {
      expect(
        canTransition(TransactionState.DRAFT, TransactionState.CANCELLED),
      ).toBe(true);
    });

    it("PENDING can transition to CONFIRMED", () => {
      expect(
        canTransition(TransactionState.PENDING, TransactionState.CONFIRMED),
      ).toBe(true);
    });

    it("PENDING can transition to FAILED", () => {
      expect(
        canTransition(TransactionState.PENDING, TransactionState.FAILED),
      ).toBe(true);
    });

    it("PENDING can transition to CANCELLED", () => {
      expect(
        canTransition(TransactionState.PENDING, TransactionState.CANCELLED),
      ).toBe(true);
    });

    it("CONFIRMED can transition to RECONCILED", () => {
      expect(
        canTransition(TransactionState.CONFIRMED, TransactionState.RECONCILED),
      ).toBe(true);
    });

    it("FAILED has no valid transitions", () => {
      expect(getValidTransitions(TransactionState.FAILED)).toHaveLength(0);
    });
  });

  describe("Invalid Transitions", () => {
    it("DRAFT cannot transition to CONFIRMED", () => {
      expect(
        canTransition(TransactionState.DRAFT, TransactionState.CONFIRMED),
      ).toBe(false);
    });

    it("DRAFT cannot transition to FAILED", () => {
      expect(
        canTransition(TransactionState.DRAFT, TransactionState.FAILED),
      ).toBe(false);
    });

    it("DRAFT cannot transition to RECONCILED", () => {
      expect(
        canTransition(TransactionState.DRAFT, TransactionState.RECONCILED),
      ).toBe(false);
    });

    it("PENDING cannot transition back to DRAFT", () => {
      expect(
        canTransition(TransactionState.PENDING, TransactionState.DRAFT),
      ).toBe(false);
    });

    it("CONFIRMED cannot transition back to DRAFT", () => {
      expect(
        canTransition(TransactionState.CONFIRMED, TransactionState.DRAFT),
      ).toBe(false);
    });

    it("CONFIRMED cannot transition back to PENDING", () => {
      expect(
        canTransition(TransactionState.CONFIRMED, TransactionState.PENDING),
      ).toBe(false);
    });

    it("CONFIRMED cannot transition to FAILED", () => {
      expect(
        canTransition(TransactionState.CONFIRMED, TransactionState.FAILED),
      ).toBe(false);
    });

    it("RECONCILED cannot transition to any state", () => {
      expect(
        canTransition(TransactionState.RECONCILED, TransactionState.DRAFT),
      ).toBe(false);
      expect(
        canTransition(TransactionState.RECONCILED, TransactionState.PENDING),
      ).toBe(false);
      expect(
        canTransition(TransactionState.RECONCILED, TransactionState.CONFIRMED),
      ).toBe(false);
      expect(
        canTransition(TransactionState.RECONCILED, TransactionState.FAILED),
      ).toBe(false);
      expect(
        canTransition(TransactionState.RECONCILED, TransactionState.CANCELLED),
      ).toBe(false);
    });

    it("CANCELLED cannot transition to any state", () => {
      expect(
        canTransition(TransactionState.CANCELLED, TransactionState.DRAFT),
      ).toBe(false);
      expect(
        canTransition(TransactionState.CANCELLED, TransactionState.PENDING),
      ).toBe(false);
      expect(
        canTransition(TransactionState.CANCELLED, TransactionState.CONFIRMED),
      ).toBe(false);
      expect(
        canTransition(TransactionState.CANCELLED, TransactionState.FAILED),
      ).toBe(false);
      expect(
        canTransition(TransactionState.CANCELLED, TransactionState.RECONCILED),
      ).toBe(false);
    });
  });

  describe("Event-based Transitions", () => {
    it("SUBMIT event transitions DRAFT → PENDING", () => {
      expect(canTransitionEvent(TransactionState.DRAFT, "SUBMIT")).toBe(true);
      expect(EVENT_TO_STATE.SUBMIT).toBe(TransactionState.PENDING);
    });

    it("CONFIRM event transitions PENDING → CONFIRMED", () => {
      expect(canTransitionEvent(TransactionState.PENDING, "CONFIRM")).toBe(
        true,
      );
      expect(EVENT_TO_STATE.CONFIRM).toBe(TransactionState.CONFIRMED);
    });

    it("REJECT event transitions PENDING → FAILED", () => {
      expect(canTransitionEvent(TransactionState.PENDING, "REJECT")).toBe(true);
      expect(EVENT_TO_STATE.REJECT).toBe(TransactionState.FAILED);
    });

    it("CANCEL event transitions cancellable states → CANCELLED", () => {
      expect(canTransitionEvent(TransactionState.DRAFT, "CANCEL")).toBe(true);
      expect(canTransitionEvent(TransactionState.PENDING, "CANCEL")).toBe(true);
      expect(canTransitionEvent(TransactionState.FAILED, "CANCEL")).toBe(false);
      expect(EVENT_TO_STATE.CANCEL).toBe(TransactionState.CANCELLED);
    });

    it("RECONCILE event transitions CONFIRMED → RECONCILED", () => {
      expect(canTransitionEvent(TransactionState.CONFIRMED, "RECONCILE")).toBe(
        true,
      );
      expect(EVENT_TO_STATE.RECONCILE).toBe(TransactionState.RECONCILED);
    });

    it("SUBMIT event cannot be applied to PENDING", () => {
      expect(canTransitionEvent(TransactionState.PENDING, "SUBMIT")).toBe(
        false,
      );
    });

    it("CONFIRM event cannot be applied to DRAFT", () => {
      expect(canTransitionEvent(TransactionState.DRAFT, "CONFIRM")).toBe(false);
    });

    it("RECONCILE event cannot be applied to PENDING", () => {
      expect(canTransitionEvent(TransactionState.PENDING, "RECONCILE")).toBe(
        false,
      );
    });

    it("No event can be applied to RECONCILED state", () => {
      expect(canTransitionEvent(TransactionState.RECONCILED, "SUBMIT")).toBe(
        false,
      );
      expect(canTransitionEvent(TransactionState.RECONCILED, "CONFIRM")).toBe(
        false,
      );
      expect(canTransitionEvent(TransactionState.RECONCILED, "REJECT")).toBe(
        false,
      );
      expect(canTransitionEvent(TransactionState.RECONCILED, "CANCEL")).toBe(
        false,
      );
      expect(canTransitionEvent(TransactionState.RECONCILED, "RECONCILE")).toBe(
        false,
      );
    });

    it("No event can be applied to CANCELLED state", () => {
      expect(canTransitionEvent(TransactionState.CANCELLED, "SUBMIT")).toBe(
        false,
      );
      expect(canTransitionEvent(TransactionState.CANCELLED, "CONFIRM")).toBe(
        false,
      );
      expect(canTransitionEvent(TransactionState.CANCELLED, "REJECT")).toBe(
        false,
      );
      expect(canTransitionEvent(TransactionState.CANCELLED, "CANCEL")).toBe(
        false,
      );
      expect(canTransitionEvent(TransactionState.CANCELLED, "RECONCILE")).toBe(
        false,
      );
    });
  });

  describe("Helper Functions", () => {
    it("getValidTransitions returns correct transitions for DRAFT", () => {
      const transitions = getValidTransitions(TransactionState.DRAFT);
      expect(transitions).toContain(TransactionState.PENDING);
      expect(transitions).toContain(TransactionState.CANCELLED);
      expect(transitions).toHaveLength(2);
    });

    it("getValidTransitions returns correct transitions for PENDING", () => {
      const transitions = getValidTransitions(TransactionState.PENDING);
      expect(transitions).toContain(TransactionState.CONFIRMED);
      expect(transitions).toContain(TransactionState.FAILED);
      expect(transitions).toContain(TransactionState.CANCELLED);
      expect(transitions).toHaveLength(3);
    });

    it("getValidTransitions returns correct transitions for CONFIRMED", () => {
      const transitions = getValidTransitions(TransactionState.CONFIRMED);
      expect(transitions).toContain(TransactionState.RECONCILED);
      expect(transitions).toHaveLength(1);
    });

    it("getValidTransitions returns empty array for terminal states", () => {
      expect(getValidTransitions(TransactionState.RECONCILED)).toHaveLength(0);
      expect(getValidTransitions(TransactionState.CANCELLED)).toHaveLength(0);
    });

    it("getValidEvents returns correct events for DRAFT", () => {
      const events = getValidEvents(TransactionState.DRAFT);
      expect(events).toContain("SUBMIT");
      expect(events).toContain("CANCEL");
      expect(events).toHaveLength(2);
    });

    it("getValidEvents returns correct events for PENDING", () => {
      const events = getValidEvents(TransactionState.PENDING);
      expect(events).toContain("CONFIRM");
      expect(events).toContain("REJECT");
      expect(events).toContain("CANCEL");
      expect(events).toHaveLength(3);
    });

    it("getValidEvents returns correct events for CONFIRMED", () => {
      const events = getValidEvents(TransactionState.CONFIRMED);
      expect(events).toContain("RECONCILE");
      expect(events).toHaveLength(1);
    });

    it("getValidEvents returns empty array for terminal states", () => {
      expect(getValidEvents(TransactionState.RECONCILED)).toHaveLength(0);
      expect(getValidEvents(TransactionState.CANCELLED)).toHaveLength(0);
    });

    it("getValidEvents returns empty for FAILED state", () => {
      expect(getValidEvents(TransactionState.FAILED)).toHaveLength(0);
    });
  });

  describe("State Machine Completeness", () => {
    it("every state has defined transitions (even if empty)", () => {
      const allStates: TransactionState[] = [
        TransactionState.DRAFT,
        TransactionState.PENDING,
        TransactionState.CONFIRMED,
        TransactionState.FAILED,
        TransactionState.CANCELLED,
        TransactionState.RECONCILED,
      ];

      allStates.forEach((state) => {
        expect(VALID_TRANSITIONS).toHaveProperty(state);
        expect(Array.isArray(VALID_TRANSITIONS[state])).toBe(true);
      });
    });

    it("every event maps to exactly one target state", () => {
      const allEvents: TransactionEventType[] = [
        "SUBMIT",
        "CONFIRM",
        "REJECT",
        "CANCEL",
        "RECONCILE",
      ];

      allEvents.forEach((event) => {
        expect(EVENT_TO_STATE).toHaveProperty(event);
        expect(typeof EVENT_TO_STATE[event]).toBe("string");
      });
    });

    it("all event target states are valid states", () => {
      const validStates: TransactionState[] = [
        TransactionState.DRAFT,
        TransactionState.PENDING,
        TransactionState.CONFIRMED,
        TransactionState.FAILED,
        TransactionState.CANCELLED,
        TransactionState.RECONCILED,
      ];

      Object.values(EVENT_TO_STATE).forEach((targetState) => {
        expect(validStates).toContain(targetState);
      });
    });
  });

  describe("Real-world Transaction Flows", () => {
    it("Happy path: DRAFT → PENDING → CONFIRMED → RECONCILED", () => {
      expect(
        canTransition(TransactionState.DRAFT, TransactionState.PENDING),
      ).toBe(true);
      expect(
        canTransition(TransactionState.PENDING, TransactionState.CONFIRMED),
      ).toBe(true);
      expect(
        canTransition(TransactionState.CONFIRMED, TransactionState.RECONCILED),
      ).toBe(true);
    });

    it("Failure path: DRAFT → PENDING → FAILED", () => {
      expect(
        canTransition(TransactionState.DRAFT, TransactionState.PENDING),
      ).toBe(true);
      expect(
        canTransition(TransactionState.PENDING, TransactionState.FAILED),
      ).toBe(true);
    });

    it("Early cancellation: DRAFT → CANCELLED", () => {
      expect(
        canTransition(TransactionState.DRAFT, TransactionState.CANCELLED),
      ).toBe(true);
    });

    it("Mid-flow cancellation: PENDING → CANCELLED", () => {
      expect(
        canTransition(TransactionState.PENDING, TransactionState.CANCELLED),
      ).toBe(true);
    });

    it("Cannot continue after reconciliation", () => {
      expect(getValidTransitions(TransactionState.RECONCILED)).toHaveLength(0);
    });

    it("Cannot continue after cancellation", () => {
      expect(getValidTransitions(TransactionState.CANCELLED)).toHaveLength(0);
    });
  });
});
