/**
 * PURPOSE: Contract for a resolved edge — one import a file makes, reconciled by the stitch pass to a
 *   canonical definition. `from` is the importing file and `specifier`/position record where the
 *   import is written; `target` is where it lands, classified: a `local` file is keyed by its
 *   repo-relative definition path (barrels followed through to the real site, never the specifier
 *   spelling — `../b/foo` and `../../b/foo` collapse to one key) and carries the TARGET file's
 *   exported entry `signature` (its declared input/output types, pulled from that file's own analysis)
 *   so a cross-file import shows its contract in the same currency as a package/global one; `package`
 *   and `builtin` are keyed by package name and carry the declared signature read from their `.d.ts`.
 *   `importedName` is the source name chased through re-export barrels; it is absent for
 *   namespace/star/side-effect imports that name no single export.
 *
 * USAGE:
 * resolvedEdgeContract.parse({
 *   from: 'src/a/caller.ts',
 *   specifier: '../b/foo',
 *   importedName: 'foo',
 *   line: 1,
 *   column: 1,
 *   target: { kind: 'local', relPath: 'src/b/foo.ts' },
 * });
 * // Returns a validated ResolvedEdge (branded fields)
 */
import { z } from 'zod';

import { columnNumberContract } from '../column-number/column-number-contract';
import { externalSignatureContract } from '../external-signature/external-signature-contract';
import { lineNumberContract } from '../line-number/line-number-contract';
import { moduleSpecifierContract } from '../module-specifier/module-specifier-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { relPathContract } from '../rel-path/rel-path-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

// A local edge is keyed by its in-repo definition path; a package/builtin edge is keyed by package
// name and, once its `.d.ts` has been read, carries the declared `signature` of the imported callable
// when it is CALLED, or the declared `type` when the binding is used as a VALUE (`const sep = …`) —
// both absent for edges whose dependency ships no usable types (an absolute `.d.ts` path never enters
// the persisted edge, only the portable signature/type does).
//
// A `global` target is an ambient identifier used without any import (`console`, `process`) that the
// stitch resolved against `@types/node`'s global scope: a CALLED global method (`console.log(x)`)
// carries its declared `signature`; a member ACCESS (`process.env`) carries the member's `type`. Both
// are absent when `@types/node` cannot type it (recorded, never invisible). It is keyed by `name`
// (`member` is the accessed member) and has no `specifier` — it is not imported.
const resolvedTargetContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('local'), relPath: relPathContract, signature: externalSignatureContract.optional() }),
  z.object({
    kind: z.literal('package'),
    packageName: packageNameContract,
    signature: externalSignatureContract.optional(),
    type: typeDescriptorContract.optional(),
  }),
  z.object({
    kind: z.literal('builtin'),
    packageName: packageNameContract,
    signature: externalSignatureContract.optional(),
    type: typeDescriptorContract.optional(),
  }),
  z.object({
    kind: z.literal('global'),
    name: symbolNameContract,
    member: symbolNameContract.optional(),
    signature: externalSignatureContract.optional(),
    type: typeDescriptorContract.optional(),
  }),
]);

export const resolvedEdgeContract = z.object({
  from: relPathContract,
  // Absent only for a `global` target: an ambient identifier is USED, never imported, so it names no
  // module specifier. Every import edge carries one.
  specifier: moduleSpecifierContract.optional(),
  importedName: symbolNameContract.optional(),
  line: lineNumberContract,
  column: columnNumberContract,
  target: resolvedTargetContract,
});

export type ResolvedEdge = z.infer<typeof resolvedEdgeContract>;
export type ResolvedTarget = z.infer<typeof resolvedTargetContract>;
