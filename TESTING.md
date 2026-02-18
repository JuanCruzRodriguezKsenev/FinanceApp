# Testing Strategy - Finance App 3.0

## 🎯 Overview

This document describes the testing approach for the finance app. The goal is to ensure **reliable, maintainable code** with comprehensive automated tests covering critical business logic and UI components.

## 🧪 Testing Stack

- **Test Runner**: Vitest (fast, modern replacement for Jest)
- **Component Testing**: React Testing Library
- **Assertions**: @testing-library/jest-dom
- **Coverage**: V8 coverage provider
- **Framework**: Next.js 16 + React 19 + TypeScript

## 📁 Test Structure

Tests are co-located with source code in `__tests__` directories:

```
src/
├── lib/
│   └── state-machines/
│       ├── transaction.machine.ts
│       ├── transaction.service.ts
│       └── __tests__/
│           ├── transaction.machine.test.ts    (46 tests ✓)
│           └── transaction.service.test.ts    (31 tests ✓)
├── features/
│   └── transactions/
│       └── components/
│           ├── TransactionStatusBadge.tsx
│           └── __tests__/
│               └── TransactionStatusBadge.test.tsx (7 tests ✓)
```

## 🔬 Test Categories

### 1. **Unit Tests** - Pure Functions & Business Logic

Located in: `src/lib/state-machines/__tests__/`

**transaction.machine.test.ts** (46 tests)

- State definitions validation
- Valid/invalid FSM transitions
- Event-based transitions
- Helper functions (getValidTransitions, getValidEvents)
- State machine completeness
- Real-world transaction flows

**Why critical**: FSM controls all transaction state changes. Bugs here could result in invalid transactions, data corruption, or money being incorrectly tracked.

### 2. **Service Tests** - Stateful Classes

Located in: `src/lib/state-machines/__tests__/`

**transaction.service.test.ts** (31 tests)

- Constructor initialization
- State transitions with events
- Invalid transition rejection
- Context data management
- Complete transaction flows
- State immutability
- Edge cases (rapid transitions, nested objects)

**Why critical**: TransactionStateMachine is used by all server actions. Ensures context data is preserved and state changes are atomic.

### 3. **Component Tests** - UI Rendering

Located in: `src/features/transactions/components/__tests__/`

**TransactionStatusBadge.test.tsx** (7 tests)

- Renders correct label for each state
- Applies correct CSS classes
- Visual state indicators

**Why critical**: Users need accurate visual feedback about transaction states. Wrong badge = confused users.

## ⚙️ Running Tests

```bash
# Run all tests (watch mode)
npm run test

# Run all tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## 📊 Current Coverage (as of latest run)

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
All files               |     100 |    83.33 |     100 |     100
 transaction.machine.ts |     100 |    66.66 |     100 |     100
 transaction.service.ts |     100 |      100 |     100 |     100
```

**Total Tests**: 85 passing (78 FSM/Service + 7 component)

## 🎯 Testing Priorities

### ✅ Completed

1. FSM state transitions (core business logic)
2. FSM service class (state management)
3. Visual UI components (status badges)
4. Idempotency placeholder tests

### 🔄 Future Work

1. **Server Action Tests** - createTransaction, submitTransaction, etc.
2. **TransactionRow Component** - Action buttons, state-dependent rendering
3. **TransactionForm Component** - Form validation, submission
4. **Integration Tests** - Full transaction flows (create → submit → confirm)
5. **E2E Tests** - User journeys with Playwright (login, create transaction, etc.)

## 🚨 What to Test

When adding new features, prioritize tests for:

1. **State Machines** - Any new FSM transitions or states
2. **Money Calculations** - Balance updates, transfers, currency conversions
3. **Validation Logic** - Form validation, business rules
4. **Authentication/Authorization** - User access checks
5. **Data Transformations** - Serialization, API responses

## 🚫 What NOT to Test

Don't waste time testing:

- Next.js framework internals
- Third-party library code
- Database drivers (Drizzle)
- CSS styling (use visual regression testing tools instead)
- Simple getters/setters without logic

## 📝 Writing Good Tests

### ✅ DO

```typescript
// Test real behavior
it("transitions from DRAFT to PENDING on SUBMIT", () => {
  const fsm = new TransactionStateMachine();
  fsm.send("SUBMIT");
  expect(fsm.getState()).toBe(TransactionState.PENDING);
});

// Test error cases
it("rejects CONFIRM from DRAFT state", () => {
  const fsm = new TransactionStateMachine();
  expect(fsm.canTransition("CONFIRM")).toBe(false);
});
```

### ❌ DON'T

```typescript
// Don't test implementation details
it("calls setState internally", () => {
  // Testing private methods is fragile
});

// Don't write overly complex tests
it("does everything at once", () => {
  // 100 lines of setup and assertions
});
```

## 🔧 Test Configuration

Tests are configured in:

- `vitest.config.ts` - Main Vitest configuration
- `vitest.setup.ts` - Global test setup (jest-dom matchers)
- `package.json` - Test scripts

### Key Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom", // Browser-like environment
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "src/db/schema/**", // DB schema files
        "**/*.config.ts", // Config files
      ],
    },
  },
});
```

## 🐛 Debugging Tests

```bash
# Run specific test file
npm run test:run src/lib/state-machines/__tests__/transaction.machine.test.ts

# Run tests matching pattern
npm run test:run -- --grep="CONFIRMED"

# Run with verbose output
npm run test:run -- --reporter=verbose

# Open test UI for debugging
npm run test:ui
```

## 🎓 Testing Philosophy

> "Test behavior, not implementation"

We focus on:

- **What** the code does (public API, user-facing behavior)
- **Not how** it does it (private methods, internal state)

This makes tests:

- More maintainable (refactoring doesn't break tests)
- Better documentation (shows how to use the code)
- Higher confidence (tests verify real use cases)

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🚀 Continuous Integration

Tests run automatically on:

- Every pull request
- Before merging to main
- Scheduled nightly builds

### CI Pipeline

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

**Last Updated**: January 2025
**Test Count**: 85 passing tests
**Coverage**: 100% statements, 83% branches, 100% functions
