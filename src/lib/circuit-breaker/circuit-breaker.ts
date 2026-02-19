import { logger } from "../logger";
import {
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
  CircuitBreakerOpenError,
  CircuitBreakerState,
  ICircuitBreaker,
} from "./types";

/**
 * Default configuration for circuit breaker
 */
const DEFAULT_CONFIG: Required<CircuitBreakerConfig> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
  shouldFail: (error: unknown) => true,
  onStateChange: () => {},
};

/**
 * Concrete Circuit Breaker Implementation
 *
 * Prevents cascading failures by monitoring call failures and temporarily
 * disabling service calls when failure threshold is exceeded.
 */
export class CircuitBreaker<T> implements ICircuitBreaker<T> {
  private state: CircuitBreakerState = "CLOSED";
  private metrics: CircuitBreakerMetrics = {
    totalCalls: 0,
    failedCalls: 0,
    successfulCalls: 0,
    lastError: null,
    lastErrorTime: 0,
    openedAt: null,
    state: "CLOSED",
  };
  private config: Required<CircuitBreakerConfig>;
  private nextAttemptTime: number = 0;
  private successCount: number = 0;

  constructor(
    private name: string,
    config: Partial<CircuitBreakerConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info(`[CircuitBreaker] ${name} initialized`, {
      config: {
        failureThreshold: this.config.failureThreshold,
        successThreshold: this.config.successThreshold,
        timeout: this.config.timeout,
      },
    });
  }

  /**
   * Execute a function through the circuit breaker
   *
   * Throws CircuitBreakerOpenError if circuit is open
   * Records failures/successes and manages state transitions
   */
  async execute<R>(fn: () => Promise<R>): Promise<R> {
    const startTime = Date.now();

    // Check if circuit is open
    if (this.state === "OPEN") {
      const timeSinceOpen =
        Date.now() - this.nextAttemptTime + this.config.timeout;

      if (timeSinceOpen < 0) {
        // Still in cooldown period
        logger.warn(`[CircuitBreaker] ${this.name} is OPEN`, {
          nextRetryIn: -timeSinceOpen,
        });
        throw new CircuitBreakerOpenError(
          this.metrics.lastError,
          this.nextAttemptTime,
        );
      } else {
        // Timeout expired, try to recover
        this.setState("HALF_OPEN");
        this.successCount = 0;
        logger.info(`[CircuitBreaker] ${this.name} transitioning to HALF_OPEN`);
      }
    }

    try {
      // Execute the function
      const result = await fn();

      // Record success
      this.recordSuccess(Date.now() - startTime);

      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(error, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Record a successful call
   *
   * May transition from HALF_OPEN to CLOSED if recovery succeeds
   */
  private recordSuccess(duration: number): void {
    this.metrics.totalCalls++;
    this.metrics.successfulCalls++;

    if (this.state === "HALF_OPEN") {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.setState("CLOSED");
        logger.info(`[CircuitBreaker] ${this.name} recovered - closed`);
      }
    }

    logger.debug(`[CircuitBreaker] ${this.name} success`, { duration });
  }

  /**
   * Record a failed call
   *
   * May transition from CLOSED to OPEN if failure threshold exceeded
   */
  private recordFailure(error: unknown, duration: number): void {
    this.metrics.totalCalls++;
    this.metrics.failedCalls++;
    this.metrics.lastError = error;
    this.metrics.lastErrorTime = Date.now();

    logger.warn(`[CircuitBreaker] ${this.name} failure`, {
      duration,
      totalCalls: this.metrics.totalCalls,
      failedCalls: this.metrics.failedCalls,
      failureRate: (
        (this.metrics.failedCalls / this.metrics.totalCalls) *
        100
      ).toFixed(2),
    });

    // Check if should open circuit
    if (this.state !== "OPEN") {
      const failureRate = this.metrics.failedCalls / this.metrics.totalCalls;

      if (
        this.metrics.failedCalls >= this.config.failureThreshold &&
        (this.metrics.totalCalls >= this.config.failureThreshold ||
          failureRate > 0.5)
      ) {
        this.setState("OPEN");
        this.nextAttemptTime = Date.now() + this.config.timeout;
        logger.error(
          `[CircuitBreaker] ${this.name} opened - failure threshold exceeded`,
          undefined,
          {
            failureCount: this.metrics.failedCalls,
            threshold: this.config.failureThreshold,
            nextRetryTime: new Date(this.nextAttemptTime).toISOString(),
          },
        );
      }
    }
  }

  /**
   * Change state and trigger callback
   */
  private setState(newState: CircuitBreakerState): void {
    if (newState !== this.state) {
      const oldState = this.state;
      this.state = newState;
      this.metrics.state = newState;

      if (newState === "OPEN") {
        this.metrics.openedAt = Date.now();
      }

      this.config.onStateChange?.(oldState, newState);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    logger.info(`[CircuitBreaker] ${this.name} reset`);
    this.setState("CLOSED");
    this.metrics = {
      totalCalls: 0,
      failedCalls: 0,
      successfulCalls: 0,
      lastError: null,
      lastErrorTime: 0,
      openedAt: null,
      state: "CLOSED",
    };
    this.successCount = 0;
    this.nextAttemptTime = 0;
  }

  /**
   * Manually open the circuit breaker
   */
  open(): void {
    logger.warn(`[CircuitBreaker] ${this.name} manually opened`);
    this.setState("OPEN");
    this.nextAttemptTime = Date.now() + this.config.timeout;
  }

  /**
   * Manually close the circuit breaker
   */
  close(): void {
    logger.info(`[CircuitBreaker] ${this.name} manually closed`);
    this.setState("CLOSED");
    this.successCount = 0;
  }

  /**
   * Attempt recovery from OPEN state
   * Useful for manual recovery triggers
   */
  async attemptRecovery(): Promise<void> {
    if (this.state === "OPEN") {
      logger.info(`[CircuitBreaker] ${this.name} attempting manual recovery`);
      this.setState("HALF_OPEN");
      this.successCount = 0;
    }
  }
}

/**
 * Create a new circuit breaker instance
 */
export function createCircuitBreaker<T>(
  name: string,
  config?: Partial<CircuitBreakerConfig>,
): ICircuitBreaker<T> {
  return new CircuitBreaker(name, config);
}
