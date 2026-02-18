# Circuit Breaker Pattern Implementation

## Overview

The Circuit Breaker pattern prevents cascading failures by monitoring call failures and temporarily disabling requests to a service when failure threshold is exceeded. This implementation provides a production-ready circuit breaker for protecting API calls, database operations, and other external service calls.

## Architecture

### States

```
                    (Failures < Threshold)
                         CLOSED
                    /              \
              [Failure]          [Success]
                /                    \
             OPEN ←→ HALF_OPEN ← [Timeout Elapsed]
              /              \
        [Manual Reset]    [Success Threshold Reached]
            |                   |
            └───→ CLOSED ←──────┘
```

### State Descriptions

- **CLOSED**: Normal operation state. All requests pass through and are monitored.
- **OPEN**: Failure state. Circuit breaker rejects all requests immediately without executing function.
- **HALF_OPEN**: Recovery state. Limited requests allowed to test if the service has recovered.

## Usage Patterns

### Basic Usage

```typescript
import { createCircuitBreaker } from '@/lib/circuit-breaker';

// Create a circuit breaker
const breaker = createCircuitBreaker('my-api', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
});

// Use it to protect a function
try {
  const result = await breaker.execute(() =>
    fetch('https://api.example.com/data')
  );
} catch (error) {
  // Handle error or CircuitBreakerOpenError
}
```

### Function Wrapper

```typescript
import { withCircuitBreaker } from '@/lib/circuit-breaker';

// Wrap existing functions
const getUser = async (id: string) => {
  // ... fetch user logic
};

const protectedGetUser = withCircuitBreaker(
  'user-service',
  getUser,
  { failureThreshold: 10, timeout: 60000 }
);

// Use as normal function
const user = await protectedGetUser('123');
```

### Factory Presets

```typescript
import { CircuitBreakerFactory } from '@/lib/circuit-breaker';

// Pre-configured for external APIs (higher thresholds)
const apiBreaker = CircuitBreakerFactory.externalAPI('payment-api', {
  // Defaults: failureThreshold: 10, timeout: 60000
});

// Pre-configured for database (balanced settings)
const dbBreaker = CircuitBreakerFactory.database('postgres', {
  // Defaults: failureThreshold: 5, timeout: 30000
});

// Pre-configured for cache (aggressive settings)
const cacheBreaker = CircuitBreakerFactory.cache('redis', {
  // Defaults: failureThreshold: 3, timeout: 10000
});

// Pre-configured for webhooks (very tolerant)
const webhookBreaker = CircuitBreakerFactory.webhook('stripe-webhooks', {
  // Defaults: failureThreshold: 20, timeout: 120000
});
```

### Global Registry

```typescript
import { circuitBreakerRegistry } from '@/lib/circuit-breaker';

// Register breakers globally
const breaker = CircuitBreakerFactory.database('main-db');
circuitBreakerRegistry.register('main-db', breaker);

// Monitor all breakers
const status = circuitBreakerRegistry.getStatus();
console.log(status);
// Output:
// {
//   'main-db': {
//     state: 'CLOSED',
//     totalCalls: 250,
//     successRate: '98.40%'
//   }
// }

// Get specific breaker
const mainDb = circuitBreakerRegistry.get('main-db');

// Reset all
circuitBreakerRegistry.resetAll();
```

### Metrics & Monitoring

```typescript
const breaker = createCircuitBreaker('my-service');

// Get detailed metrics
const metrics = breaker.getMetrics();
console.log(metrics);
// {
//   totalCalls: 100,
//   failedCalls: 5,
//   successfulCalls: 95,
//   lastError: Error(...),
//   lastErrorTime: 1708123456789,
//   openedAt: 1708123450000,
//   state: 'CLOSED'
// }

// Get current state
const state = breaker.getState(); // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
```

### Manual Control

```typescript
const breaker = createCircuitBreaker('my-service');

// Manually open (emergency stop)
breaker.open();

// Manually close (resume operation)
breaker.close();

// Manually attempt recovery
await breaker.attemptRecovery();

// Reset all metrics
breaker.reset();
```

## Configuration Options

```typescript
interface CircuitBreakerConfig {
  // Number of failures before opening (default: 5)
  failureThreshold: number;

  // Number of successes in HALF_OPEN before closing (default: 2)
  successThreshold: number;

  // Time to wait before attempting recovery in ms (default: 30000 = 30s)
  timeout: number;

  // Custom error detection (default: always counts as failure)
  shouldFail?: (error: unknown) => boolean;

  // State change callback
  onStateChange?: (from: State, to: State) => void;
}
```

## Best Practices

### 1. Choose Appropriate Thresholds

```typescript
// For unreliable external APIs
CircuitBreakerFactory.externalAPI('unstable-api', {
  failureThreshold: 15,  // More tolerate
  timeout: 60000,        // Longer recovery period
});

// For local database
CircuitBreakerFactory.database('critical-db', {
  failureThreshold: 3,   // Quick to detect issues
  timeout: 10000,        // Quick recovery attempt
});
```

### 2. Custom Error Detection

```typescript
const breaker = createCircuitBreaker('api', {
  shouldFail: (error) => {
    // Don't count timeout as failure, only network errors
    if (error instanceof TimeoutError) return false;
    return true;
  },
});
```

### 3. State Change Monitoring

```typescript
const breaker = createCircuitBreaker('critical-service', {
  onStateChange: (from, to) => {
    logger.warn(`Circuit breaker state change: ${from} → ${to}`);
    // Send alert, metrics, etc.
    if (to === 'OPEN') {
      sendAlert('critical-service is down');
    }
  },
});
```

### 4. Graceful Degradation

```typescript
const breaeker = CircuitBreakerFactory.externalAPI('recommendation-engine');

async function getRecommendations(userId: string) {
  try {
    return await breaker.execute(() =>
      fetchRecommendations(userId)
    );
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      // Service is down, return cached or default
      return getCachedRecommendations(userId) || DEFAULT_RECOMMENDATIONS;
    }
    throw error;
  }
}
```

### 5. Combine with Result Pattern

```typescript
import { ok, err } from '@/lib/result';
import { createCircuitBreaker } from '@/lib/circuit-breaker';

const breaker = CircuitBreakerFactory.externalAPI('payment-api');

export async function processPayment(
  amount: number,
  accountId: string
): Promise<Result<void, AppError>> {
  try {
    await breaker.execute(() =>
      paymentServiceAPI.charge(amount, accountId)
    );
    return ok(void 0);
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      return err(networkError('Payment service temporarily unavailable'));
    }
    return err(networkError('Payment processing failed'));
  }
}
```

## Error Handling

### CircuitBreakerOpenError

Thrown when circuit is OPEN and request is rejected:

```typescript
import { CircuitBreakerOpenError } from '@/lib/circuit-breaker';

try {
  await breaker.execute(fn);
} catch (error) {
  if (error instanceof CircuitBreakerOpenError) {
    console.log('Circuit is open');
    console.log('Last error:', error.lastError);
    console.log('Next retry at:', new Date(error.nextRetryTime));
  }
}
```

## Logging

All state changes and failures are automatically logged via the logger:

```
[CircuitBreaker] my-service initialized
[CircuitBreaker] my-service failure - totalCalls: 1, failedCalls: 1
[CircuitBreaker] my-service opened - next retry in 30000ms
[CircuitBreaker] my-service transitioning to HALF_OPEN
[CircuitBreaker] my-service recovered - closed
```

## Real-World Example

```typescript
import { CircuitBreakerFactory, circuitBreakerRegistry } from '@/lib/circuit-breaker';
import { ok, err, networkError } from '@/lib/result';

// Create app-wide circuit breakers
const neonDB = CircuitBreakerFactory.database('neon-postgres', {
  failureThreshold: 10,
  timeout: 20000,
  onStateChange: (from, to) => {
    if (to === 'OPEN') {
      logger.error('Database circuit breaker opened');
      // Trigger failover, send alerts, etc.
    }
  },
});

const stripeAPI = CircuitBreakerFactory.externalAPI('stripe', {
  failureThreshold: 10,
  timeout: 60000,
});

circuitBreakerRegistry.register('neon-postgres', neonDB);
circuitBreakerRegistry.register('stripe', stripeAPI);

// Use in server actions
export async function createTransaction(data: CreateTransactionInput) {
  try {
    const result = await neonDB.execute(() =>
      db.insert(transactions).values(data).returning()
    );

    return ok(result);
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      return err(networkError('Database service temporarily unavailable'));
    }
    return err(databaseError('insert', 'Failed to create transaction'));
  }
}

// Expose health endpoint
export function getCircuitBreakerStatus() {
  return circuitBreakerRegistry.getStatus();
}
```

## Testing

```typescript
describe('CircuitBreaker', () => {
  it('should open after threshold failures', async () => {
    const breaker = createCircuitBreaker('test', {
      failureThreshold: 3,
      timeout: 100,
    });

    let callCount = 0;
    const failingFn = async () => {
      callCount++;
      throw new Error('fail');
    };

    // Trigger failures
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch {}
    }

    expect(breaker.getState()).toBe('OPEN');
    expect(() => breaker.execute(failingFn)).rejects.toThrow(
      CircuitBreakerOpenError
    );
  });

  it('should recover to HALF_OPEN after timeout', async () => {
    const breaker = createCircuitBreaker('test', {
      failureThreshold: 1,
      timeout: 100,
    });

    breaker.open();
    expect(breaker.getState()).toBe('OPEN');

    await new Promise((resolve) => setTimeout(resolve, 150));
    // Next execute will transition to HALF_OPEN
  });
});
```

## Migration Path

To add Circuit Breaker to existing server actions:

1. Import `CircuitBreakerFactory`
2. Create breaker instance at top of action file
3. Wrap database/API calls with `breaker.execute()`
4. Handle `CircuitBreakerOpenError` in Result pattern

```typescript
// Before
export async function getTransactions(userId: string): Promise<Result<Transaction[], AppError>> {
  try {
    const data = await db.query.transactions.findMany(...);
    return ok(data);
  } catch (error) {
    return err(databaseError('select', 'Failed to fetch transactions'));
  }
}

// After
const breaker = CircuitBreakerFactory.database('transactions-db');

export async function getTransactions(userId: string): Promise<Result<Transaction[], AppError>> {
  try {
    const data = await breaker.execute(() =>
      db.query.transactions.findMany(...)
    );
    return ok(data);
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      return err(networkError('Database temporarily unavailable'));
    }
    return err(databaseError('select', 'Failed to fetch transactions'));
  }
}
```
