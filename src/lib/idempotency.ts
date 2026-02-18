import { createHash } from "crypto";

export type IdempotencyKeyParts = Array<string | number | null | undefined>;

export function normalizeIdempotencyKey(
  key?: string | null,
): string | undefined {
  const trimmed = key?.trim();
  return trimmed ? trimmed : undefined;
}

export function createIdempotencyKey(
  scope: string,
  userId: string,
  parts: IdempotencyKeyParts,
  providedKey?: string | null,
): string {
  const normalizedKey = normalizeIdempotencyKey(providedKey);
  if (normalizedKey) {
    return normalizedKey;
  }

  const normalizedParts = parts
    .map((part) => (part === null || part === undefined ? "" : String(part)))
    .join("|");

  const base = `${scope}|${userId}|${normalizedParts}`;
  const hash = createHash("sha256").update(base).digest("hex");

  return `${scope}:${hash}`;
}
