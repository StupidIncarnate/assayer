/**
 * PURPOSE: The return type of an adapter that performs a side effect and has no natural return value.
 *   It exists until the adapters it serves are removed. Each of those adapters returns the literal
 *   `{ success: true as const }`. A branded schema's type rejects that literal, so this file declares
 *   the shape as a plain type, with no schema, no stub and no test.
 *
 * USAGE:
 * const done = (): AdapterResult => ({ success: true as const });
 * // done() returns { success: true }
 */

export interface AdapterResult {
  success: true;
}
