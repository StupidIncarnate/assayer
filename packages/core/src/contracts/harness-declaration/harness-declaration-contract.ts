/**
 * PURPOSE: Contract for a harness DECLARATION — the whole authored vocabulary of a colocated
 *   `<basename>.harness.ts`, and the PUBLISHED type an author is checked against. `inputs` is keyed by
 *   ENTRY name, then by PARAMETER name, and each leaf is the value Assayer refused to construct.
 *
 *   `unknown` at the leaf is deliberate and is the whole point of the artifact: what a harness supplies
 *   is precisely what the fill seam has no vocabulary for — a callback, an instance, a thing with
 *   identity. Narrowing it would demand the very type language whose absence raised the invoice.
 *
 *   One key, one invoice. There is no surface, no named state and no declared case here: a key Assayer
 *   never asked for is the ceremonial declaration this project refuses, and it is reported as a build
 *   error rather than accommodated.
 *
 * USAGE:
 * harnessDeclarationContract.parse({ inputs: { audit: { report: (m: string): string => m } } });
 * // Returns a validated HarnessDeclaration — values pass through by reference
 */
import { z } from 'zod';

// Two open shapes rather than `z.record`: a record keyed by a BRANDED name infers
// `Partial<Record<SymbolName, …>>`, which an author's `{ audit: { report } }` literal cannot satisfy —
// and an author who cannot write the artifact is the one failure this type exists to prevent. A
// property-less object with a catchall carries the same runtime validation and infers the open
// `{ [entry: string]: { [param: string]: unknown } }` an editor accepts.
export const harnessDeclarationContract = z.object({
  inputs: z.object({}).catchall(z.object({}).catchall(z.unknown())),
});

export type HarnessDeclaration = z.infer<typeof harnessDeclarationContract>;
