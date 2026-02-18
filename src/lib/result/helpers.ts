import { Result, Ok, ok, err } from "./types";

export function combine<T extends readonly Result<any, any>[]>(
  results: T,
): Result<
  { [K in keyof T]: T[K] extends Ok<infer V> ? V : never },
  T[number] extends Result<any, infer E> ? E : never
> {
  const values: any[] = [];
  for (const result of results) {
    if (result.isErr()) return result as any;
    values.push(result.value);
  }
  return ok(values as any);
}

export async function fromPromise<T, E = Error>(
  promise: Promise<T>,
  errorMapper?: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    const mappedError = errorMapper ? errorMapper(error) : (error as E);
    return err(mappedError);
  }
}

export function fromThrowable<T, E = Error>(
  fn: () => T,
  errorMapper?: (error: unknown) => E,
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    const mappedError = errorMapper ? errorMapper(error) : (error as E);
    return err(mappedError);
  }
}
