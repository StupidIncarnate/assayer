/**
 * PURPOSE: Contract for a module edge — one import or re-export DECLARATION a file makes, recorded
 *   as a flat file-level fact: the module specifier its source is named with, the bindings it pulls
 *   or forwards, and the declaration's position. It is the raw, unresolved half of the cross-file
 *   graph — the walk records it verbatim and a later stitch pass resolves the specifier to a
 *   definition site. `kind` distinguishes an `import` from a re-export (`export … from`), which is
 *   what lets the stitch follow re-export barrels without re-parsing. A third `kind`, `dynamic`, is a
 *   dynamic `import()` whose specifier is NOT a string literal (`import(name)`): it carries no
 *   specifier and no bindings, and the stitch hard-errors it as a computed specifier — the analyzer
 *   cannot drive a runtime-chosen module. A dynamic `import('./x')` of a string LITERAL is instead
 *   recorded as an ordinary `import` edge, since its dependency is a real, resolvable static fact.
 *
 *   Bindings are structural, never spelling: a `named` binding carries the SOURCE name and, when the
 *   declaration renames it, the local/exported-as alias; `default` and `namespace` carry the local
 *   name; `star` is a bare `export *` that forwards everything. A `dynamic` edge forwards nothing, so
 *   its `bindings` is always empty and its `specifier` is absent.
 *
 * USAGE:
 * moduleEdgeContract.parse({
 *   kind: 'import',
 *   specifier: './other',
 *   bindings: [{ kind: 'named', name: 'foo' }],
 *   line: 1,
 *   column: 1,
 * });
 * // Returns a validated ModuleEdge (branded fields)
 */
import { z } from 'zod';

import { columnNumberContract } from '../column-number/column-number-contract';
import { lineNumberContract } from '../line-number/line-number-contract';
import { moduleSpecifierContract } from '../module-specifier/module-specifier-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

const moduleBindingContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('named'), name: symbolNameContract, alias: symbolNameContract.optional() }),
  z.object({ kind: z.literal('default'), local: symbolNameContract }),
  z.object({ kind: z.literal('namespace'), local: symbolNameContract }),
  z.object({ kind: z.literal('star') }),
]);

export const moduleEdgeContract = z.object({
  kind: z.enum(['import', 'reexport', 'dynamic']).brand<'ModuleEdgeKind'>(),
  // Absent only for a `dynamic` edge: a dynamic `import()` whose specifier is not a string literal
  // names no module the single-file parse can read.
  specifier: moduleSpecifierContract.optional(),
  bindings: z.array(moduleBindingContract),
  line: lineNumberContract,
  column: columnNumberContract,
});

export type ModuleEdge = z.infer<typeof moduleEdgeContract>;
export type ModuleBinding = z.infer<typeof moduleBindingContract>;
