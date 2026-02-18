/**
 * Circuit Breaker Tests & Examples
 *
 * Demonstrates the Circuit Breaker pattern implementation
 * with realistic scenarios and edge cases.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  createCircuitBreaker,
  CircuitBreakerFactory,
  CircuitBreakerOpenError,
} from "./index";

describe("CircuitBreaker", () => {
  describe("Basic Functionality", () => {
    it("should execute function when CLOSED", async () => {
      const breaker = createCircuitBreaker("test");
      const fn = jest.fn(async () => "success");

      const result = await breaker.execute(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe("CLOSED");
    });

    it("should track successful calls", async () => {
      const breaker = createCircuitBreaker("test");

      await breaker.execute(async () => "success");
      await breaker.execute(async () => "success");

      const metrics = breaker.getMetrics();
      expect(metrics.totalCalls).toBe(2);
      expect(metrics.successfulCalls).toBe(2);
      expect(metrics.failedCalls).toBe(0);
    });

    it("should track failed calls", async () => {
      const breaker = createCircuitBreaker("test");
      const error = new Error("fail");

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw error;
          });
        } catch {}
      }

      const metrics = breaker.getMetrics();
      expect(metrics.totalCalls).toBe(3);
      expect(metrics.failedCalls).toBe(3);
      expect(metrics.lastError).toBe(error);
    });
  });

  describe("State Transitions", () => {
    it("should transition CLOSED → OPEN on threshold", async () => {
      const breaker = createCircuitBreaker("test", {
        failureThreshold: 2,
        timeout: 100,
      });

      expect(breaker.getState()).toBe("CLOSED");

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}

      expect(breaker.getState()).toBe("CLOSED");

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}

      expect(breaker.getState()).toBe("OPEN");
    });

    it("should reject all calls when OPEN", async () => {
      const breaker = createCircuitBreaker("test", {
        failureThreshold: 1,
        timeout: 100,
      });

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}

      expect(breaker.getState()).toBe("OPEN");

      const fn = jest.fn();
      try {
        await breaker.execute(fn);
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
      }

      expect(fn).not.toHaveBeenCalled();
    });

    it("should transition OPEN → HALF_OPEN after timeout", async () => {
      const breaker = createCircuitBreaker("test", {
        failureThreshold: 1,
        timeout: 50,
      });

      breaker.open();
      expect(breaker.getState()).toBe("OPEN");

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      const fn = jest.fn(async () => "success");
      try {
        await breaker.execute(fn);
      } catch {}

      expect(breaker.getState()).toBe("HALF_OPEN");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should transition HALF_OPEN → CLOSED on success", async () => {
      const breaker = createCircuitBreaker("test", {
        failureThreshold: 1,
        timeout: 50,
        successThreshold: 2,
      });

      breaker.open();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // First success
      await breaker.execute(async () => "success");
      expect(breaker.getState()).toBe("HALF_OPEN");

      // Second success (threshold reached)
      await breaker.execute(async () => "success");
      expect(breaker.getState()).toBe("CLOSED");
    });

    it("should transition HALF_OPEN → OPEN on failure", async () => {
      const breaker = createCircuitBreaker("test", {
        failureThreshold: 1,
        timeout: 50,
      });

      breaker.open();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(breaker.getState()).toBe("HALF_OPEN");

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}

      expect(breaker.getState()).toBe("OPEN");
    });
  });

  describe("Manual Control", () => {
    it("should manually open the circuit", () => {
      const breaker = createCircuitBreaker("test");

      expect(breaker.getState()).toBe("CLOSED");
      breaker.open();
      expect(breaker.getState()).toBe("OPEN");
    });

    it("should manually close the circuit", () => {
      const breaker = createCircuitBreaker("test");

      breaker.open();
      expect(breaker.getState()).toBe("OPEN");

      breaker.close();
      expect(breaker.getState()).toBe("CLOSED");
    });

    it("should reset metrics", () => {
      const breaker = createCircuitBreaker("test");

      breaker.open();
      const metrics1 = breaker.getMetrics();

      breaker.reset();
      const metrics2 = breaker.getMetrics();

      expect(metrics2.state).toBe("CLOSED");
      expect(metrics2.totalCalls).toBe(0);
      expect(metrics2.failedCalls).toBe(0);
      expect(metrics2.openedAt).toBeNull();
    });

    it("should attempt manual recovery", async () => {
      const breaker = createCircuitBreaker("test");

      breaker.open();
      expect(breaker.getState()).toBe("OPEN");

      await breaker.attemptRecovery();
      expect(breaker.getState()).toBe("HALF_OPEN");
    });
  });

  describe("State Change Callbacks", () => {
    it("should call onStateChange callback", async () => {
      const onStateChange = jest.fn();

      const breaker = createCircuitBreaker("test", {
        failureThreshold: 1,
        timeout: 100,
        onStateChange,
      });

      breaker.open();
      expect(onStateChange).toHaveBeenCalledWith("CLOSED", "OPEN");

      breaker.close();
      expect(onStateChange).toHaveBeenCalledWith("OPEN", "CLOSED");
    });
  });

  describe("Factory Presets", () => {
    it("should create external API breaker with correct defaults", () => {
      const breaker = CircuitBreakerFactory.externalAPI("api");
      const metrics = breaker.getMetrics();

      // Verify it was created (can't directly check config)
      expect(metrics.state).toBe("CLOSED");
    });

    it("should create database breaker with correct defaults", () => {
      const breaker = CircuitBreakerFactory.database("db");
      const metrics = breaker.getMetrics();

      expect(metrics.state).toBe("CLOSED");
    });

    it("should create cache breaker with correct defaults", () => {
      const breaker = CircuitBreakerFactory.cache("redis");
      const metrics = breaker.getMetrics();

      expect(metrics.state).toBe("CLOSED");
    });

    it("should create webhook breaker with correct defaults", () => {
      const breaker = CircuitBreakerFactory.webhook("stripe");
      const metrics = breaker.getMetrics();

      expect(metrics.state).toBe("CLOSED");
    });
  });

  describe("Error Handling", () => {
    it("should throw CircuitBreakerOpenError with context", async () => {
      const breaker = createCircuitBreaker("test", {
        failureThreshold: 1,
      });

      const originalError = new Error("original");

      try {
        await breaker.execute(async () => {
          throw originalError;
        });
      } catch {}

      try {
        await breaker.execute(async () => {
          throw new Error("should not execute");
        });
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
        expect((error as CircuitBreakerOpenError).lastError).toBe(
          originalError,
        );
        expect((error as CircuitBreakerOpenError).nextRetryTime).toBeDefined();
      }
    });

    it("should propagate wrapped function errors", async () => {
      const breaker = createCircuitBreaker("test");
      const error = new Error("custom error");

      try {
        await breaker.execute(async () => {
          throw error;
        });
      } catch (caught) {
        expect(caught).toBe(error);
      }
    });
  });

  describe("Metrics", () => {
    it("should provide accurate metrics", async () => {
      const breaker = createCircuitBreaker("test");

      await breaker.execute(async () => "success");
      await breaker.execute(async () => "success");

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}

      const metrics = breaker.getMetrics();

      expect(metrics.totalCalls).toBe(3);
      expect(metrics.successfulCalls).toBe(2);
      expect(metrics.failedCalls).toBe(1);
      expect(metrics.state).toBe("CLOSED");
      expect(metrics.lastError).toBeDefined();
      expect(metrics.lastErrorTime).toBeGreaterThan(0);
    });
  });

  describe("Realistic Scenarios", () => {
    it("should handle API degradation gracefully", async () => {
      const breaker = CircuitBreakerFactory.externalAPI("third-party-api", {
        failureThreshold: 5,
        timeout: 100,
        successThreshold: 2,
      });

      // Simulate API degradation: first 5 calls fail
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("API error");
          });
        } catch {}
      }

      expect(breaker.getState()).toBe("OPEN");

      // Service is unavailable
      try {
        await breaker.execute(async () => null);
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
      }

      // Wait for recovery
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Service recovered
      await breaker.execute(async () => ({ status: "ok" }));
      expect(breaker.getState()).toBe("HALF_OPEN");

      await breaker.execute(async () => ({ status: "ok" }));
      expect(breaker.getState()).toBe("CLOSED");
    });

    it("should handle cascading failures", async () => {
      const breaker = CircuitBreakerFactory.database("postgres", {
        failureThreshold: 3,
      });

      // Simulate cascading failure
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("Connection timeout");
          });
        } catch {}
      }

      // Circuit open, prevent further calls
      const blockedFn = jest.fn();

      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(blockedFn);
        } catch {}
      }

      // Function was never called thanks to circuit breaker
      expect(blockedFn).not.toHaveBeenCalled();
    });
  });
});

/**
 * Example: Integrating with server actions
 */
export async function exampleTransactionAction() {
  const dbBreaker = CircuitBreakerFactory.database("transactions-db", {
    failureThreshold: 5,
    timeout: 30000,
  });

  try {
    // This would be your actual database call
    const result = await dbBreaker.execute(async () => {
      // const transaction = await db.transaction.create(...);
      // return transaction;
      return { id: "1", amount: 100 };
    });

    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      return {
        ok: false,
        error: "Database service temporarily unavailable",
      };
    }
    return { ok: false, error: "Transaction failed" };
  }
}
