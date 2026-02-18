/**
 * Idempotency tests (documentation-only).
 *
 * This file is intentionally non-executable to avoid test runner setup.
 * Use it as a reference for manual or future automated tests.
 */

/*
import { createTransaction } from "@/core/actions/transactions";

// Example pseudo-tests:
//
// it("should return same result for duplicate requests", async () => {
//   const key = "test-key-123";
//   const data = { amount: 250, description: "Test" };
//
//   const res1 = await createTransaction(data, key);
//   const res2 = await createTransaction(data, key);
//
//   expect(res1.value?.id).toBe(res2.value?.id);
// });
//
// it("should log duplicate attempts", async () => {
//   const key = "duplicate-key";
//   await createTransaction(data, key);
//   await createTransaction(data, key);
//
//   const log = await db.idempotencyLog.findUnique({
//     where: { idempotency_key: key },
//   });
//
//   expect(log?.duplicate_attempts).toBe(1);
// });
*/
