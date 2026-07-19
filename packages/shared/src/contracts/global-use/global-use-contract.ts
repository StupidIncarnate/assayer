/**
 * PURPOSE: Contract for a global use — one USE, in a file, of an ambient identifier the hermetic walk
 *   cannot resolve (`console`, `process`, `Buffer`, `setTimeout`, …). It is the ambient-external half
 *   of the cross-file graph: where a module edge names an imported module, a global use names a free
 *   identifier that resolves to NOTHING in the analyzer's typeless project (the lib resolves
 *   `Number`/`JSON`; it does not resolve `process`), recorded WITHOUT resolving it so the walk stays
 *   hermetic. A later stitch pass resolves each against `@types/node`'s global scope.
 *
 *   `name` is the root identifier; `member` is the first member accessed off it (`console`→`log`,
 *   `process`→`env`), absent for a bare-identifier call (`setTimeout(…)`). `called` records whether the
 *   use is a call, and `args` its argument shapes (a caller param passed straight through, a welded
 *   literal, or opaque) — the same structural projection a local call carries, never a source value
 *   (P4). `line`/`column` anchor where a stitch build-error would land (the call site a reader acts on).
 *
 * USAGE:
 * globalUseContract.parse({ name: 'console', member: 'log', called: true, args: [{ kind: 'opaque' }], line: 1, column: 1 });
 * // Returns a validated GlobalUse (branded fields)
 */
import { z } from 'zod';

import { columnNumberContract } from '../column-number/column-number-contract';
import { lineNumberContract } from '../line-number/line-number-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

// The structural projection of one argument — identical in shape to a local call's arg, never the
// value it would compute: a `param-ref` a caller passes straight through, a `literal` welded in, or
// `opaque` for anything else.
const globalCallArgContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('param-ref'), paramName: symbolNameContract }),
  z.object({ kind: z.literal('literal'), value: representativeValueContract }),
  z.object({ kind: z.literal('opaque') }),
]);

export const globalUseContract = z.object({
  name: symbolNameContract,
  member: symbolNameContract.optional(),
  called: z.boolean(),
  args: z.array(globalCallArgContract),
  line: lineNumberContract,
  column: columnNumberContract,
});

export type GlobalUse = z.infer<typeof globalUseContract>;
export type GlobalCallArg = z.infer<typeof globalCallArgContract>;
