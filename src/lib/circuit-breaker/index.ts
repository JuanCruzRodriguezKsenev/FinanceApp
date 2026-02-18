/**
 * Circuit Breaker Decorators & Higher-Order Functions
 *
 * Provides utilities to apply circuit breaker pattern to existing functions
 * without modifying their implementation.
 */

import { CircuitBreaker } from "./circuit-breaker";
import {
  CircuitBreakerConfig,
  ICircuitBreaker,
  CircuitBreakerOpenError,
} from "./types";
import { logger } from "../logger";

/**
 * Create a new circuit breaker instance
 *
 * Usage:
 * ```typescript
 * const breaker = createCircuitBreaker('api', { failureThreshold: 5 });
 * ```
 */
export function createCircuitBreaker<T = any>(
  name: string,
  config?: Partial<CircuitBreakerConfig>,
): CircuitBreaker<T> {
  return new CircuitBreaker<T>(name, config);
}

/**
 * Export the CircuitBreaker class for direct use
 */
export { CircuitBreaker };

/**
 * Export the error class for error handling
 */
export { CircuitBreakerOpenError };

/**
 * Wraps an async function with a circuit breaker
 *
 * Usage:
 * ```typescript
 * const protectedFetch = withCircuitBreaker(
 *   'external-api',
 *   fetch,
 *   { failureThreshold: 5, timeout: 30000 }
 * );
 * ```
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  config?: Partial<CircuitBreakerConfig>,
): T {
  const breaker = new CircuitBreaker(name, config);

  return (async (...args: any[]) => {
    return breaker.execute(() => fn(...args));
  }) as T;
}

/**
 * Wraps a class method with a circuit breaker
 *
 * Usage:
 * ```typescript
 * class DatabaseService {
 *   @circuitBreakerDecorator('db-queries', { failureThreshold: 10 })
 *   async query(sql: string): Promise<any> {
 *     // implementation
 *   }
 * }
 * ```
 */
export function circuitBreakerDecorator(
  name: string,
  config?: Partial<CircuitBreakerConfig>,
): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol | undefined,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const breaker = new CircuitBreaker(name, config);

    descriptor.value = async function (...args: any[]) {
      return breaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Factory to create pre-configured circuit breakers for common use cases
 */
export const CircuitBreakerFactory = {
  /**
   * Create a circuit breaker for external API calls
   * Defaults: high failure threshold (10), longer timeout (60s)
   */
  externalAPI(name: string, config?: Partial<CircuitBreakerConfig>) {
    return new CircuitBreaker(name, {
      failureThreshold: 10,
      successThreshold: 3,
      timeout: 60000,
      ...config,
    });
  },

  /**
   * Create a circuit breaker for database calls
   * Defaults: medium failure threshold (5), medium timeout (30s)
   */
  database(name: string, config?: Partial<CircuitBreakerConfig>) {
    return new CircuitBreaker(name, {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      ...config,
    });
  },

  /**
   * Create a circuit breaker for cache/memory operations
   * Defaults: low failure threshold (3), quick timeout (10s)
   */
  cache(name: string, config?: Partial<CircuitBreakerConfig>) {
    return new CircuitBreaker(name, {
      failureThreshold: 3,
      successThreshold: 1,
      timeout: 10000,
      ...config,
    });
  },

  /**
   * Create a circuit breaker for webhook/event operations
   * Defaults: high failure threshold (20), very long timeout (120s)
   */
  webhook(name: string, config?: Partial<CircuitBreakerConfig>) {
    return new CircuitBreaker(name, {
      failureThreshold: 20,
      successThreshold: 5,
      timeout: 120000,
      ...config,
    });
  },
};

/**
 * Global circuit breaker registry
 * Useful for monitoring and managing multiple breakers
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, ICircuitBreaker<any>>();

  /**
   * Register a circuit breaker
   */
  register<T>(name: string, breaker: ICircuitBreaker<T>): ICircuitBreaker<T> {
    if (this.breakers.has(name)) {
      logger.warn(
        `[CircuitBreakerRegistry] Overwriting existing breaker: ${name}`,
      );
    }
    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Get a registered circuit breaker
   */
  get<T>(name: string): ICircuitBreaker<T> | undefined {
    return this.breakers.get(name) as ICircuitBreaker<T> | undefined;
  }

  /**
   * Get all registered breakers
   */
  getAll(): Map<string, ICircuitBreaker<any>> {
    return new Map(this.breakers);
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * Get health status of all breakers
   */
  getStatus() {
    const status: Record<string, any> = {};
    for (const [name, breaker] of this.breakers) {
      const metrics = breaker.getMetrics();
      status[name] = {
        state: breaker.getState(),
        totalCalls: metrics.totalCalls,
        successRate:
          metrics.totalCalls > 0
            ? (
                ((metrics.totalCalls - metrics.failedCalls) /
                  metrics.totalCalls) *
                100
              ).toFixed(2) + "%"
            : "N/A",
      };
    }
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    logger.info("[CircuitBreakerRegistry] All breakers reset");
  }
}

/**
 * Global registry instance
 */
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
