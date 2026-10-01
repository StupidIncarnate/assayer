/**
 * PURPOSE: One entry the case interpreter can apply: an exported function, a method bound to a fresh
 *   instance, or the thunk that re-imports a module. `caseResolveEntryBroker` returns this, or
 *   undefined when the module does not carry the entry. It is a function type, which Zod cannot
 *   check, so this file holds a type and no schema.
 *
 * USAGE:
 * const entry: DrivableEntry = (value: unknown): unknown => value;
 * // Applied positionally by caseInterpretBroker through Reflect.apply
 */

export type DrivableEntry = (...args: unknown[]) => unknown;
