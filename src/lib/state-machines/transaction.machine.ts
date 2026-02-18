export enum TransactionState {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  RECONCILED = "RECONCILED",
}

export type TransactionEventType =
  | "SUBMIT"
  | "CONFIRM"
  | "REJECT"
  | "CANCEL"
  | "RECONCILE";

export const VALID_TRANSITIONS: Record<TransactionState, TransactionState[]> = {
  [TransactionState.DRAFT]: [
    TransactionState.PENDING,
    TransactionState.CANCELLED,
  ],
  [TransactionState.PENDING]: [
    TransactionState.CONFIRMED,
    TransactionState.FAILED,
    TransactionState.CANCELLED,
  ],
  [TransactionState.CONFIRMED]: [TransactionState.RECONCILED],
  [TransactionState.FAILED]: [],
  [TransactionState.CANCELLED]: [],
  [TransactionState.RECONCILED]: [],
};

export const EVENT_TO_STATE: Record<TransactionEventType, TransactionState> = {
  SUBMIT: TransactionState.PENDING,
  CONFIRM: TransactionState.CONFIRMED,
  REJECT: TransactionState.FAILED,
  CANCEL: TransactionState.CANCELLED,
  RECONCILE: TransactionState.RECONCILED,
};

export function canTransition(
  from: TransactionState,
  to: TransactionState,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionEvent(
  from: TransactionState,
  event: TransactionEventType,
): boolean {
  return canTransition(from, EVENT_TO_STATE[event]);
}

export function getValidTransitions(
  from: TransactionState,
): TransactionState[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function getValidEvents(from: TransactionState): TransactionEventType[] {
  const validTargetStates = getValidTransitions(from);
  return Object.entries(EVENT_TO_STATE)
    .filter(([_, targetState]) => validTargetStates.includes(targetState))
    .map(([event]) => event as TransactionEventType);
}
