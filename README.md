# Finance App 3.0

A modern, type-safe financial management application built with Next.js 16, React 19, and TypeScript.

**Status:** ✅ Core infrastructure implemented | 🚧 Product hardening in progress

---

## 🎯 Quick Navigation

- **Getting Started**: → READ [START_HERE.md](START_HERE.md)
- **Architecture**: → READ [ARCHITECTURE.md](ARCHITECTURE.md)
- **What's Implemented**: → READ [COMPLETION_CHECKLIST.md](COMPLETION_CHECKLIST.md)
- **Advanced Ideas**: → READ [docs/guides/ADVANCED_RECOMMENDATIONS.md](docs/guides/ADVANCED_RECOMMENDATIONS.md)

---

## 🏗️ Core Infrastructure

### Result Pattern

Type-safe error handling with discriminated unions

- Location: `src/lib/result/`
- Usage: Wrap async operations
- Benefit: Compile-time error safety

### Circuit Breaker

Prevent cascading failures in distributed systems

- Location: `src/lib/circuit-breaker/`
- Usage: Wrap external calls (API, DB)
- Benefit: Automatic resilience & recovery

### Validators

Centralized, reusable validation library

- Location: `src/lib/validators/`
- Usage: Form inputs, server action params
- Benefit: Single source of truth for validation rules

---

## 📚 Documentation

| Document                                           | Brief                           | Audience         |
| -------------------------------------------------- | ------------------------------- | ---------------- |
| [START_HERE.md](START_HERE.md)                     | Quick start & patterns overview | Everyone         |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | System design & components      | Developers       |
| [COMPLETION_CHECKLIST.md](COMPLETION_CHECKLIST.md) | What's implemented              | Project Managers |
| [docs/guides/](docs/guides/)                       | Specific patterns & features    | Advanced Use     |
| [docs/archive/](docs/archive/)                     | Historical context              | Reference        |

---

## 🚀 Get Started

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run db:push

# 3. Start development
npm run dev
```

Then open http://localhost:3000 and navigate to [START_HERE.md](START_HERE.md)

---

## 📦 What You Get

- ✅ 38+ Server Actions (type-safe)
- ✅ Bank account management
- ✅ Transaction tracking
- ✅ Auto-categorization
- ✅ Suspicious activity detection
- ✅ Resilient error handling
- ✅ Full TypeScript coverage

---

## 🧭 Roadmap Snapshot (Next)

- ✅ Idempotency + FSM core done
- ✅ Vertical architecture refactor done
- ⏳ UI smoke tests + polish
- ⏸️ Message broker (deferred; see [PLAN_CONSTRUCCION.md](PLAN_CONSTRUCCION.md))

---

## 🎓 Learn the Patterns

### 1. Error Handling (Result Pattern)

```typescript
import { ok, err, validationError } from "@/lib/result";

const result = await myAction(data);
if (result.isOk()) {
  // result.value available
} else {
  // result.error available
}
```

### 2. Resilience (Circuit Breaker)

```typescript
import { CircuitBreakerFactory } from '@/lib/circuit-breaker';

const breaker = CircuitBreakerFactory.database('my-db');
await breaker.execute(() => db.query(...));
```

### 3. Validation (Validators)

```typescript
import { validateSchema, stringValidators } from "@/lib/validators";

const validation = validateSchema(formData, {
  email: stringValidators.email(),
});
```

---

**Created by:** System Architecture Team  
**Last Updated:** February 18, 2026  
**Next Step:** → Open [START_HERE.md](START_HERE.md)
