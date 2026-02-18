/**
 * Circuit Breaker Implementation
 *
 * Implements the Circuit Breaker pattern to prevent cascading failures
 * by monitoring API/DB call failures and temporarily disabling requests.
 *
 * States:
 * - CLOSED: Normal operation, all requests pass through
 * - OPEN: Too many failures detected, all requests fail immediately
 * - HALF_OPEN: Recovery attempt in progress, limited requests allowed
 */

/**
 * Possible states for the circuit breaker
 */
export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

/**
 * Configuration for circuit breaker behavior
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold: number;

  /** Number of successful calls before closing circuit from HALF_OPEN (default: 2) */
  successThreshold: number;

  /** Time to wait before attempting recovery (ms, default: 30000) */
  timeout: number;

  /** Optional custom error detector function */
  shouldFail?: (error: unknown) => boolean;

  /** Optional callback on state change */
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;
}

/**
 * Internal metrics tracked by circuit breaker
 */
export interface CircuitBreakerMetrics {
  /** Total number of calls */
  totalCalls: number;

  /** Number of failed calls */
  failedCalls: number;

  /** Number of successful calls */
  successfulCalls: number;

  /** Last error encountered */
  lastError: unknown;

  /** Timestamp of last error */
  lastErrorTime: number;

  /** Timestamp when circuit opened */
  openedAt: number | null;

  /** Current state */
  state: CircuitBreakerState;
}

/**
 * Circuit breaker instance interface
 */
export interface ICircuitBreaker<T> {
  /** Execute a function through the circuit breaker */
  execute<R>(fn: () => Promise<R>): Promise<R>;

  /** Get current metrics */
  getMetrics(): CircuitBreakerMetrics;

  /** Get current state */
  getState(): CircuitBreakerState;

  /** Manually reset the circuit breaker */
  reset(): void;

  /** Manually open the circuit breaker */
  open(): void;

  /** Manually close the circuit breaker */
  close(): void;

  /** Attempt recovery from OPEN state */
  attemptRecovery(): Promise<void>;
}

/**
 * Circuit breaker error thrown when circuit is open
 */
export class CircuitBreakerOpenError extends Error {
  constructor(
    public readonly lastError?: unknown,
    public readonly nextRetryTime?: number,
  ) {
    super("Circuit breaker is OPEN - service temporarily unavailable");
    this.name = "CircuitBreakerOpenError";
  }
}
