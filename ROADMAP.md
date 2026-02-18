# 🗺️ ROADMAP - Finance App 3.0

**Última actualización:** 18 Feb 2026  
**Versión actual:** v0.9 (Pre-production)

---

## ✅ COMPLETED (Phase 1-2)

### Infrastructure Core

- ✅ Result Pattern (type-safe error handling)
- ✅ Circuit Breaker (resilient external calls)
- ✅ Validators (centralized validation)
- ✅ Logger (structured logging)

### Security & Reliability

- ✅ Idempotency pattern (prevent double-charges)
- ✅ FSM for transaction states (DRAFT → PENDING → CONFIRMED → RECONCILED)
- ✅ Transaction state transitions with validation
- ✅ Idempotency keys in DB + API routes

### Architecture

- ✅ Vertical architecture refactor (feature-based folders)
- ✅ Clean feature boundaries (transactions, bank-accounts, contacts, wallets)
- ✅ Shared libraries for cross-cutting concerns

### Features

- ✅ 38+ type-safe server actions
- ✅ Bank account management
- ✅ Transaction tracking with auto-detection
- ✅ Digital wallet support
- ✅ Contact/payee management
- ✅ Suspicious activity flags

---

## 🚧 IN PROGRESS (Phase 2.5)

### Testing & Hardening

- ⏳ UI smoke tests (manual QA on dashboard, transactions)
- ⏳ Transaction state badge UI validation
- ⏳ FSM action buttons validation
- [ ] End-to-end idempotency test with curl
- [ ] Regression test suite (basic)

### Documentation

- ✅ Architecture map updated
- ✅ Vertical structure documented
- ⏳ API route docs
- [ ] Component storybook (if needed)

---

## 📅 PLANNED (Phase 3+)

### Scalability (Deferred)

- ⏸️ **Message Broker Implementation** (Bull + Redis)
  - Trigger: >100 events/day OR async jobs critical
  - Use cases: email notifications, analytics, reconciliation, webhooks
  - See: [PLAN_CONSTRUCCION.md - Fase 3](PLAN_CONSTRUCCION.md#-fase-3-escalabilidad---message-broker-semana-3)

### Advanced Features (Backlog)

- [ ] Recurring transactions
- [ ] Budget tracking
- [ ] Financial goal progress visualization
- [ ] Multi-currency support (full)
- [ ] Transaction reconciliation automation
- [ ] Bank statement import (OFX, CSV)
- [ ] Reports & analytics dashboard
- [ ] Export data (PDF, Excel)

### Integrations (Future)

- [ ] Bank API integrations (Plaid, Belvo)
- [ ] Payment gateways (Stripe, MercadoPago)
- [ ] Email notifications (SendGrid, Resend)
- [ ] Push notifications (Firebase, OneSignal)
- [ ] Webhooks for external systems

### DevOps & Production

- [ ] CI/CD pipeline
- [ ] Automated tests (unit, integration, e2e)
- [ ] Performance monitoring (Sentry, Datadog)
- [ ] Logging aggregation (Logtail, Papertrail)
- [ ] Database backups automation
- [ ] Staging environment
- [ ] Blue-green deployment

---

## 🎯 DECISION POINTS

### When to Implement Message Broker?

**Triggers:**

- Volume reaches 100+ events/day consistently
- Async jobs become critical (email, reconciliation)
- Need job retry/failure handling
- Need observability for background tasks

**Estimated effort:** 8 hours (1 week part-time)

### When to Add Tests?

**Triggers:**

- Before first production deploy
- When team grows beyond 1-2 devs
- When refactoring core logic

**Estimated effort:** 16 hours (2 weeks part-time)

### When to Implement Bank Integrations?

**Triggers:**

- Manual entry becomes bottleneck
- Users request automatic sync
- Product-market fit validated

**Estimated effort:** 40+ hours (depends on providers)

---

## 📊 MILESTONES

### v1.0 - Production Ready (Target: End of Feb 2026)

- ✅ Core infrastructure complete
- 🚧 UI smoke tests pass
- [ ] Basic regression suite
- [ ] Documentation complete
- [ ] Deployed to production (Vercel + Neon)

### v1.1 - Hardened (Target: Mid Mar 2026)

- [ ] Message broker implemented (if needed)
- [ ] Full test coverage (>70%)
- [ ] Performance optimizations
- [ ] Monitoring & alerts

### v2.0 - Feature Complete (Target: Q2 2026)

- [ ] Bank integrations
- [ ] Recurring transactions
- [ ] Budget tracking
- [ ] Reports & analytics

---

## 🔄 REVIEW CADENCE

- **Weekly:** Review in-progress tasks
- **Monthly:** Reassess priorities and backlog
- **Quarterly:** Revisit roadmap and long-term vision

---

**Next Review:** End of February 2026  
**Owner:** Tech Lead  
**Stakeholders:** Product, Engineering
