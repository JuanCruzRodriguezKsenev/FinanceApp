/**
 * Circuit Breaker Examples & Documentation
 *
 * This file demonstrates the Circuit Breaker pattern implementation
 * with realistic scenarios and edge cases.
 *
 * These are example use cases showing how to use the circuit breaker.
 * They are presented as commented code for reference.
 */

import {
  createCircuitBreaker,
  CircuitBreakerFactory,
  CircuitBreakerOpenError,
} from "./index";

/**
 * Circuit Breaker Examples & Documentation
 *
 * This file demonstrates the Circuit Breaker pattern implementation
 * with realistic scenarios and edge cases.
 *
 * These are example use cases showing how to use the circuit breaker.
 * They are presented as commented code for reference.
 */

import {
  createCircuitBreaker,
  CircuitBreakerFactory,
  CircuitBreakerOpenError,
} from "./index";

/**
 * EXAMPLE 1: Basic Usage
 *
 * Creating and using a circuit breaker
 */
// const breaker = createCircuitBreaker("test");
// const result = await breaker.execute(async () => "success");
// console.log(breaker.getState()); // "CLOSED"
// console.log(breaker.getMetrics());

/**
 * EXAMPLE 2: Handling Failures
 *
 * Circuit breaker opens after threshold failures
 */
// const breaker = createCircuitBreaker("test", {
//   failureThreshold: 2,
//   timeout: 100,
// });
//
// try {
//   await breaker.execute(async () => {
//     throw new Error("fail");
//   });
// } catch {}
//
// try {
//   await breaker.execute(async () => {
//     throw new Error("fail");
//   });
// } catch {}
//
// console.log(breaker.getState()); // "OPEN"

/**
 * EXAMPLE 3: State Transitions
 *
 * Manual state control
 */
// const breaker = createCircuitBreaker("test");
// breaker.open();
// console.log(breaker.getState()); // "OPEN"
// breaker.close();
// console.log(breaker.getState()); // "CLOSED"

/**
 * EXAMPLE 4: Factory Presets
 *
 * Using predefined configurations for common scenarios
 */
// const apiBreaker = CircuitBreakerFactory.externalAPI("stripe-api");
// const dbBreaker = CircuitBreakerFactory.database("postgres");
// const cacheBreaker = CircuitBreakerFactory.cache("redis");
// const webhookBreaker = CircuitBreakerFactory.webhook("slack");

/**
 * EXAMPLE 5: Error Handling
 *
 * Catching and handling circuit breaker errors
 */
// const breaker = createCircuitBreaker("test", {
//   failureThreshold: 1,
// });
//
// try {
//   await breaker.execute(async () => {
//     throw new Error("original error");
//   });
// } catch {}
//
// try {
//   await breaker.execute(async () => null);
// } catch (error) {
//   if (error instanceof CircuitBreakerOpenError) {
//     console.log("Circuit is open, retrying later");
//     console.log(error.nextRetryTime);
//   }
// }

/**
 * EXAMPLE 6: Realistic Scenario - API Integration
 *
 * Protecting external API calls
 */
// export async function fetchUserData(userId: string) {
//   const apiBreaker = CircuitBreakerFactory.externalAPI("user-api", {
//     failureThreshold: 5,
//     timeout: 30000,
//     successThreshold: 2,
//   });
//
//   try {
//     const result = await apiBreaker.execute(async () => {
//       const response = await fetch(`/api/users/${userId}`);
//       return response.json();
//     });
//     return { ok: true, data: result };
//   } catch (error) {
//     if (error instanceof CircuitBreakerOpenError) {
//       return {
//         ok: false,
//         error: "User service temporarily unavailable",
//       };
//     }
//     return { ok: false, error: "Failed to fetch user data" };
//   }
// }

/**
 * EXAMPLE 7: Database Protection
 *
 * Protecting database operations
 */
// export async function getUserTransactions(userId: string) {
//   const dbBreaker = CircuitBreakerFactory.database("transactions-db", {
//     failureThreshold: 5,
//     timeout: 30000,
//   });
//
//   try {
//     const result = await dbBreaker.execute(async () => {
//       // const transactions = await db.transaction.findMany({
//       //   where: { userId }
//       // });
//       // return transactions;
//       return [];
//     });
//
//     return { ok: true, data: result };
//   } catch (error) {
//     if (error instanceof CircuitBreakerOpenError) {
//       return {
//         ok: false,
//         error: "Database service temporarily unavailable",
//       };
//     }
//     return { ok: false, error: "Transaction failed" };
//   }
// }

/**
 * EXAMPLE 8: Cache Integration
 *
 * Protecting cache operations
 */
// export async function getCachedData(key: string) {
//   const cacheBreaker = CircuitBreakerFactory.cache("redis-cache");
//
//   try {
//     return await cacheBreaker.execute(async () => {
//       // return await redis.get(key);
//       return null;
//     });
//   } catch (error) {
//     // Fall back to database if cache fails
//     return null;
//   }
// }

/**
 * EXAMPLE 9: Webhook Delivery
 *
 * Protecting webhook sends
 */
// export async function sendWebhook(url: string, data: any) {
//   const webhookBreaker = CircuitBreakerFactory.webhook("external-webhooks", {
//     failureThreshold: 3,
//     timeout: 5000,
//   });
//
//   try {
//     await webhookBreaker.execute(async () => {
//       await fetch(url, {
//         method: "POST",
//         body: JSON.stringify(data),
//       });
//     });
//   } catch (error) {
//     if (error instanceof CircuitBreakerOpenError) {
//       // Queue for retry
//       console.log("Webhook delivery failed, queuing for retry");
//     }
//   }
// }

/**
 * EXAMPLE 10: State Change Callbacks
 *
 * React to state changes
 */
// const breaker = createCircuitBreaker("test", {
//   onStateChange: (from, to) => {
//     console.log(`Circuit breaker transitioned from ${from} to ${to}`);
//     // Could send metrics, alerts, etc.
//   },
// });

/**
 * EXAMPLE 11: Metrics and Monitoring
 *
 * Getting detailed metrics for monitoring
 */
// const breaker = createCircuitBreaker("test");
//
// await breaker.execute(async () => "success");
// await breaker.execute(async () => "success");
// try {
//   await breaker.execute(async () => {
//     throw new Error("fail");
//   });
// } catch {}
//
// const metrics = breaker.getMetrics();
// console.log({
//   totalCalls: metrics.totalCalls,         // 3
//   successfulCalls: metrics.successfulCalls, // 2
//   failedCalls: metrics.failedCalls,       // 1
//   state: metrics.state,                   // "CLOSED"
//   successRate: metrics.successRate,       // "66.67%"
// });
