# 🔟 TODO Items - Checklist Ejecutable

**Fecha:** 18 Febrero 2026  
**Estado:** Listo para empezar  
**Responsable:** [Tu nombre]

---

## 📋 Índice de TODOs

1. [Tests - Server Actions](#tests-server-actions)
2. [Tests - Components](#tests-components)
3. [Tests - Utilities](#tests-utilities)
4. [Documentación](#documentación)
5. [Arquitectura](#arquitectura)
6. [Cleanup](#cleanup)
7. [Validación Final](#validación-final)

---

## 🧪 Tests - Server Actions

### 📌 Tests para Transaction Actions

**Archivo:** `src/features/transactions/actions/__tests__/transactions.test.ts`

```typescript
// Crear archivo con siguientes tests:
// - [x] Test: createTransactionWithAutoDetection - Success
// - [x] Test: createTransactionWithAutoDetection - Validation error
// - [x] Test: createTransactionWithAutoDetection - Idempotency (same key = same result)
// - [x] Test: createTransactionWithAutoDetection - DB error
// - [x] Test: createTransactionWithAutoDetection - Auto-detect type
// - [x] Test: createTransactionWithAutoDetection - Auto-detect category
// - [x] Test: updateBalancesAfterTransaction - Correct calculation
// - [x] Test: updateBalancesAfterTransaction - Multiple transactions
// - [x] Test: flagTransactionAsSuspicious - Mark as suspicious
// - [x] Test: flagTransactionAsSuspicious - Already flagged

Status: ✅ COMPLETADO (18 tests passing)
Effort: 6h
```

**Checklist para implementar:**

- [x] Crear carpeta `__tests__`
- [x] Crear archivo `transactions.test.ts`
- [x] Setup mock de DB (vi.mock)
- [x] Escribir 10+ tests (18 tests implementados)
- [x] Ejecutar `npm run test` - pasen
- [x] Commit: "test: add transaction actions tests"

---

### 📌 Tests para Bank Account Actions

**Archivo:** `src/features/bank-accounts/actions/__tests__/bank-accounts.test.ts`

```
- [x] Test: createBankAccount - Valid data
- [x] Test: createBankAccount - Duplicate account (CBU)
- [x] Test: createBankAccount - Invalid amount
- [x] Test: getBankAccounts - Returns user accounts only
- [x] Test: updateBankAccount - Valid update
- [x] Test: updateBankAccount - CBU conflict
- [x] Test: deleteBankAccount - With active transactions (should fail)
- [x] Test: deleteBankAccount - Without transactions (should succeed)
- [x] Test: updateBankAccountBalance - Correct calculation

Status: ✅ COMPLETADO (21 tests passing)
Effort: 4h
```

**Checklist:**

- [x] Crear `bank-accounts.test.ts`
- [x] Setup mocks
- [x] Escribir 9+ tests (21 tests implementados)
- [x] Ejecutar tests - pasen
- [x] Commit

---

### 📌 Tests para Contacts & Digital Wallets Actions

**Archivos:**

- `src/features/contacts/actions/__tests__/contacts.test.ts`
- `src/features/digital-wallets/actions/__tests__/digital-wallets.test.ts`

```
Contacts:
- [ ] createContact - Valid data
- [ ] getContacts - User specific
- [ ] updateContact - Valid update
- [ ] deleteContact - Validation

Wallets:
- [ ] createDigitalWallet - Valid data
- [ ] getDigitalWallets - User specific
- [ ] updateWallet - Balance update
- [ ] deleteWallet - With balance

Status: ⏳ TO DO
Effort: 2h
```

---

## 🎨 Tests - Components

### 📌 TransactionForm Component Test

**Archivo:** `src/features/transactions/components/__tests__/TransactionForm.test.tsx`

```typescript
// Tests a implementar:
- [ ] Test: Render all form fields
- [ ] Test: Submit form with valid data
- [ ] Test: Show validation errors
- [ ] Test: Show loading state
- [ ] Test: Show error messages
- [ ] Test: Call onSuccess callback
- [ ] Test: Auto-categor description change
- [ ] Test: Format currency input

Status: ⏳ TO DO
Effort: 6h
```

**Steps:**

1. [ ] Crear `__tests__` folder
2. [ ] Crear `TransactionForm.test.tsx`
3. [ ] Import React Testing Library
4. [ ] Escribir 8+ tests
5. [ ] Mock server action
6. [ ] Ejecutar - pasen
7. [ ] Commit

---

### 📌 BankAccountManager Component Test

**Archivo:** `src/features/bank-accounts/components/__tests__/BankAccountManager.test.tsx`

```
- [ ] Test: Render account list
- [ ] Test: Show empty state
- [ ] Test: Open add form on button click
- [ ] Test: Submit new account
- [ ] Test: Delete account with confirmation
- [ ] Test: Show validation errors
- [ ] Test: Load accounts on mount
- [ ] Test: Refetch after add/delete

Status: ⏳ TO DO
Effort: 4h
```

---

### 📌 Additional Component Tests

**Components:**

- [ ] `TransactionRow.test.tsx` (2h)
- [ ] `TransactionsSummary.test.tsx` (2h)
- [ ] `TransactionStatusBadge.test.tsx` (Already exists, verify)

---

## 🛠️ Tests - Utilities

### 📌 Validators Tests

**Archivo:** `src/lib/validators/__tests__/validators.test.ts`

```typescript
// Tests para cada validador:
- [ ] validateEmail: 8 tests
  - [ ] Valid email
  - [ ] Invalid email
  - [ ] Empty
  - [ ] With spaces
  - [ ] Multiple @
  - [ ] No domain
  - [ ] Already registered (async)
  - [ ] Case insensitive

- [ ] validatePassword: 8 tests
  - [ ] Minimum length
  - [ ] Uppercase required
  - [ ] Numbers required
  - [ ] Valid password

- [ ] validateAmount: 10 tests
  - [ ] Positive numbers
  - [ ] Negative (should fail)
  - [ ] Decimals
  - [ ] Max value
  - [ ] Currency specific

- [ ] validateCBU: 8 tests
- [ ] validateIBAN: 8 tests
- [ ] ... más validadores

Total: 80+ tests

Status: ⏳ TO DO
Effort: 4h
```

**Setup:**

1. [ ] Crear `src/lib/validators/__tests__/` folder
2. [ ] Crear `validators.test.ts`
3. [ ] Por cada validador:
   - [ ] Casos válidos
   - [ ] Casos inválidos
   - [ ] Edge cases
   - [ ] Async cases

---

### 📌 Transaction Utilities Tests

**Archivo:** `src/lib/__tests__/transactionUtils.test.ts`

```
- [ ] calculateTotalByType: 6 tests
- [ ] calculateTotals: 5 tests
- [ ] calculateBalance: 5 tests
- [ ] getTransactionStats: 5 tests

Total: 20 tests

Status: ⏳ TO DO
Effort: 2h
```

---

### 📌 Transaction Detector Tests

**Archivo:** `src/lib/__tests__/transaction-detector.test.ts`

```
- [ ] detectTransactionType: 15 tests
  - [ ] Income keywords
  - [ ] Expense keywords
  - [ ] Transfer detection
  - [ ] Amount patterns
  - [ ] Withdrawal detection

- [ ] detectCategoryFromDescription: 20 tests
  - [ ] Food keywords
  - [ ] Transport keywords
  - [ ] Entertainment keywords
  - [ ] Health keywords
  - [ ] Unknown category

- [ ] detectSuspiciousActivity: 10 tests
  - [ ] Unusual amount
  - [ ] Multiple transactions
  - [ ] Late night tx
  - [ ] Pattern change

Total: 45 tests

Status: ⏳ TO DO
Effort: 2h
```

---

## 📚 Documentación

### 📌 JSDoc para Componentes

**Archivos a documentar:**

- [ ] `src/features/transactions/components/TransactionForm.tsx` (1h)
  - [ ] Add component JSDoc
  - [ ] Document Props interface
  - [ ] Add usage example
  - [ ] Document inner functions

- [ ] `src/features/transactions/components/TransactionRow.tsx` (0.5h)
- [ ] `src/features/transactions/components/TransactionsSummary.tsx` (0.5h)
- [ ] `src/features/bank-accounts/components/BankAccountManager.tsx` (1h)
- [ ] `src/components/ui/Buttons/Button.tsx` (0.5h)
- [ ] `src/components/ui/Form/Form.tsx` (0.5h)

**Total:4h**

**Template:**

```typescript
/**
 * [Component name] - [Short description]
 *
 * [Detailed description of what it does]
 *
 * Features:
 * - Feature 1
 * - Feature 2
 *
 * @component
 * @param {Type} prop1 - Description
 * @param {Type} prop2 - Description
 * @returns {JSX.Element}
 *
 * @example
 * <ComponentName prop1="value" />
 */
```

---

### 📌 JSDoc para Server Actions

**Archivos a documentar:**

- [ ] `src/features/transactions/actions/transactions.ts` (1.5h)
  - [ ] createTransactionWithAutoDetection
  - [ ] updateBalancesAfterTransaction
  - [ ] flagTransactionAsSuspicious
  - [ ] getTransactionsWithMetadata

- [ ] `src/features/bank-accounts/actions/bank-accounts.ts` (1.5h)
- [ ] `src/features/contacts/actions/contacts.ts` (1h)
- [ ] `src/features/digital-wallets/actions/digital-wallets.ts` (1h)

**Total: 5h**

**Template:**

```typescript
/**
 * [Function name] - [Short description]
 *
 * [Detailed description]
 *
 * Validates:
 * - Validation 1
 * - Validation 2
 *
 * @param {Type} param1 - Description
 * @returns {Promise<Result<SuccessType, ErrorType>>}
 * @throws {AppError} Possible errors
 *
 * @example
 * const result = await functionName(data);
 * if (result.isOk()) {
 *   // Handle success
 * } else {
 *   // Handle error
 * }
 */
```

---

### 📌 Create Feature READMEs

- [ ] `src/features/transactions/README.md`
- [ ] `src/features/bank-accounts/README.md`
- [ ] `src/features/contacts/README.md`
- [ ] `src/features/digital-wallets/README.md`

**Template:** See [08_OPTIMIZACION_ARQUITECTURA.md](./08_OPTIMIZACION_ARQUITECTURA.md#-readme-para-cada-feature)

**Effort:** 4h total (1h each)

---

## 🏗️ Arquitectura

### 📌 Reorganizar Componentes

```bash
# 1. Move transaction components
- [ ] mv src/components/transactions/* src/features/transactions/components/
- [ ] mv src/components/auth/* src/features/auth/components/ (if exists)
- [ ] rmdir src/components/transactions/ (if empty)

# 2. Update imports in app/
- [ ] grep -r "from.*components/transactions" src/app/
- [ ] Replace with: "@/features/transactions/components"

# 3. Verify
- [ ] npm run lint - no errors
- [ ] npm run build - success
- [ ] Commit: "refactor: reorganize components to features"
```

**Effort:** 1h

---

### 📌 Consolidate CSS

```bash
# 1. Create shared CSS
- [ ] Create src/components/ui/shared.module.css
- [ ] Copy shared styles (containers, flexbox, buttons, forms)

# 2. Review each CSS file (11 files)
- [ ] BankAccountManager.module.css
- [ ] TransactionForm.module.css
- [ ] Form.module.css
- [ ] ... others

# 3. Refactor each
- [ ] Extract duplicated rules to shared
- [ ] Use @composes or imports
- [ ] Verify styling unchanged

# 4. Validate
- [ ] npm run build - success
- [ ] Visual check (looks same)
- [ ] Browser devtools (class names correct)
- [ ] Commit: "refactor: consolidate duplicate CSS"
```

**Effort:** 6h

---

## 🗑️ Cleanup

### 📌 Detect Dead Code

```bash
# 1. Install tools
- [ ] npm install -D next-unused depcheck unimported

# 2. Run analysis
- [ ] npx next-unused > analysis/unused-files.txt
- [ ] npx depcheck > analysis/unused-deps.txt
- [ ] npx unimported > analysis/unresolved-imports.txt

# 3. Review results
- [ ] Document findings in audit_review/

# 4. Create examples folder
- [ ] mkdir -p examples/{components,pages,patterns}
- [ ] mv src/components/ui/Navbar/EJEMPLOS.tsx examples/
- [ ] mv src/app/ui-test/page.tsx examples/
- [ ] Create examples/README.md

# 5. Commit
- [ ] git add .
- [ ] git commit -m "chore: move examples out of src/"
```

**Effort:** 4h

---

## ✅ Validación Final

### 📌 Pre-Merge Checks

Before committing final code:

```bash
# 1. Linting
- [ ] npm run lint
- [ ] npm run lint --fix (if needed)
- [ ] npm run format

# 2. Type checking
- [ ] npm run build
- [ ] Check for TypeScript errors

# 3. Tests
- [ ] npm run test
- [ ] npm run test:coverage
- [ ] Coverage >= 80%
- [ ] All tests passing

# 4. Verification
- [ ] npm run dev
- [ ] Test app manually
- [ ] Check console for errors
- [ ] Verify UI intact

# 5. Git
- [ ] git status - clean
- [ ] git log - commits logical
- [ ] git diff - review changes

# 6. Final commit
- [ ] git commit -m "chore: audit review completion"
- [ ] git push
```

---

## 📊 Completion Track

### Week 1 Progress

- [ ] Day 1-2: Tests infrastructure + 50% of action tests
- [ ] Day 3: Component tests + remaining action tests
- [ ] Day 4-5: Utility tests +Documentation starts
- [ ] Day 5: Documentation completion

**Target:** 200+ new tests passing

---

### Week 2 Progress

- [ ] Day 1: CSS consolidation
- [ ] Day 2: Component reorganization + dead code cleanup
- [ ] Day 3-4: Feature READMEs + final documentation
- [ ] Day 5: Build/test/validation/merge

**Target:** Buildpassing, 80%+ coverage, clean codebase

---

## 🎯 Success Metrics

Check off when achieved:

- [ ] **Tests:** 300+ tests total (was 84)
- [ ] **Coverage:** 80%+ (was 7%)
- [ ] **Documentation:** 100% JSDoc (was 5%)
- [ ] **Architecture:** Components in correct location
- [ ] **CSS:** No more than -50KB duplicates
- [ ] **Dead code:** Moved to examples/
- [ ] **Build:** Passes without warnings
- [ ] **Tests:** All passing
- [ ] **Lint:** No errors or warnings

---

## 📝 Notes & Issues Found

[Space for documenting issues during implementation]

```
- Issue: [Description]
  Status: [ ] Open [ ] Resolved
  Notes: ...

- Issue: [Description]
  Status: [ ] Open [ ] Resolved
  Notes: ...
```

---

## 🚀 Go Live Checklist

Once all items are done:

- [ ] Final code review
- [ ] Merge to main
- [ ] Tag release (v0.9.1-audit or similar)
- [ ] Update CHANGELOG.md
- [ ] Notify team
- [ ] Archive audit_review/ Or keep for reference

---

## 📞 Quick Reference

**Important Commands:**

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Full build
npm run lint                   # Linting
npm run test                   # Run tests

# Quality Checks
npm run test:coverage          # Coverage report
npm run lint --fix             # Auto-fix linting

# Tools
npx next-unused                # Find unused files
npx depcheck                   # Check dependencies
npx unimported                 # Find unresolved imports
```

**Key Files:**

- Configuration: eslint.config.mjs, tsconfig.json
- Tests: vitest.config.ts, vitest.setup.ts
- This audit: /audit_review/ folder

---

**Status:** Ready to start ✅  
**Last updated:** 18 Feb 2026  
**Done by:** [Your name]
