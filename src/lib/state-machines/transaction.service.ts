import {
  canTransitionEvent,
  EVENT_TO_STATE,
  TransactionEventType,
  TransactionState,
} from "./transaction.machine";

export type TransactionStateContext = Record<string, unknown>;

export class TransactionStateMachine {
  private state: TransactionState;
  private context: TransactionStateContext;

  constructor(
    initialState: TransactionState = TransactionState.DRAFT,
    initialContext: TransactionStateContext = {},
  ) {
    this.state = initialState;
    this.context = { ...initialContext };
  }

  getState(): TransactionState {
    return this.state;
  }

  getContext(): TransactionStateContext {
    return { ...this.context };
  }

  canTransition(event: TransactionEventType): boolean {
    return canTransitionEvent(this.state, event);
  }

  send(event: TransactionEventType, data?: TransactionStateContext): void {
    if (!this.canTransition(event)) {
      return;
    }

    this.state = EVENT_TO_STATE[event];
    if (data) {
      this.context = { ...this.context, ...data };
    }
  }
}
