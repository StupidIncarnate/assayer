/**
 * PURPOSE: Contract for a harness DECLARATION — the whole authored vocabulary of a colocated
 *   `<basename>.harness.ts`, and the PUBLISHED type an author is checked against. `inputs` is keyed by
 *   ENTRY name, then by PARAMETER name, and each leaf is a value Assayer could not build on its own.
 *
 *   A leaf is any value a function argument can hold: a callback, an object whose members are
 *   callbacks, a class instance, or a plain value for a parameter typed `unknown`. A declared
 *   `undefined` is a supplied value too, because `harness-value` tells it apart from a key the harness
 *   never declared. No schema narrower than "any value" fits that list, and a schema that copied the
 *   value would break the callback's identity, so the leaf is `z.custom` with no check, which hands the
 *   value back by reference.
 *
 *   Assayer reports a key that names no entry or parameter of the target, or a parameter it can build
 *   on its own, as a build error. It never accepts such a key silently.
 *
 * USAGE:
 * harnessDeclarationContract.parse({ inputs: { audit: { report: (m: string): string => m } } });
 * // Returns a validated HarnessDeclaration — values pass through by reference
 */
import { z } from '#gateway/npm/zod';

const harnessInputValueContract = z.custom<unknown>(() => true);

// Two open shapes rather than `z.record`: a record keyed by a BRANDED name infers
// `Record<SymbolName, …>`, and an author's `{ audit: { report } }` literal cannot satisfy it, because the
// plain key `audit` is not a `SymbolName`. An author who cannot write the artifact is the one failure
// this type exists to prevent. A
// property-less object with a catchall carries the same runtime validation and infers the open
// `{ [entry: string]: { [param: string]: unknown } }` an editor accepts.
export const harnessDeclarationContract = z.object({
  inputs: z.object({}).catchall(z.object({}).catchall(harnessInputValueContract).brand<'HarnessDeclarationInputs'>()).brand<'HarnessDeclarationInputs'>(),
}).brand<'HarnessDeclaration'>();

export type HarnessDeclaration = z.infer<typeof harnessDeclarationContract>;
