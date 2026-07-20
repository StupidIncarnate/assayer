/**
 * PURPOSE: Contract for a scope record — ONE executable scope the walk found (a module's top level
 *   or a function-like: declaration, arrow, expression, method, constructor, accessor), carrying the
 *   scope path that owns it, its signature, whether it is reachable from an export, and the branch
 *   and exit nodes that belong to it. Classes contribute a path SEGMENT but no record: they hold no
 *   control flow of their own. Nesting is expressed in `scopePath`, never by containment — the walk
 *   is a tree but its output is a FLAT list of entry-rooted records, so a nested function is a
 *   sibling record with a longer path and every downstream consumer reads one uniform shape.
 *
 *   The scope's EXTENT rides here because the walk is the only model that measures it: it holds the
 *   node, and every projection downstream is pure. Both ends travel together — a consumer that marks
 *   a scope on the source needs the region, not its first line, and re-deriving the second end from
 *   anything but the node it came from is the reconstruction this architecture exists to forbid.
 *
 * USAGE:
 * scopeRecordContract.parse({
 *   scopePath: ['Classifier', 'classify'], name: 'classify', kind: 'function', exported: true,
 *   params: [{ name: 'value', type: { kind: 'number' } }], returnType: { kind: 'string' },
 *   startLine: 2, endLine: 6, branches: [], exits: [],
 * });
 * // Returns a validated ScopeRecord (branded fields)
 */
import { z } from 'zod';

import {
  branchNodeContract,
  conditionNodeContract,
  entryAccessContract,
  exitNodeContract,
  lineNumberContract,
  paramDescriptorContract,
  symbolNameContract,
  typeDescriptorContract,
} from '@assayer/shared/contracts';

import { callSiteContract } from '../call-site/call-site-contract';
import { valueUseContract } from '../value-use/value-use-contract';

export const scopeRecordContract = z.object({
  scopePath: z.array(symbolNameContract),
  name: symbolNameContract,
  kind: z.enum(['module', 'function']).brand<'ScopeKind'>(),
  exported: z.boolean(),
  access: entryAccessContract,
  params: z.array(paramDescriptorContract),
  returnType: typeDescriptorContract,
  startLine: lineNumberContract,
  endLine: lineNumberContract,
  branches: z.array(branchNodeContract),
  exits: z.array(exitNodeContract),
  // The calls this scope makes, LOOSE facts claimed on the way up like branches and exits. Defaults
  // to empty so the handlers that open a scope need not thread it — the walk fills it when it claims
  // the scope's body.
  calls: z.array(callSiteContract).default([]),
  // The value uses this scope makes — bindings referenced as values (`const s = sep`), a data flow
  // that is not a call. LOOSE and claimed exactly like `calls`, on its OWN channel so it never risks
  // the follow-calls machinery, which assumes a call is a real invocation. Defaults to empty.
  valueUses: z.array(valueUseContract).default([]),
  // The names this scope EXPORTS — the declared bindings of its top-level `export const`/`let`
  // statements (`export const message = …` ⇒ `['message']`). LOOSE and claimed on its own channel like
  // `calls`; only a module scope ever collects any, since exports are top-level. A projection reads
  // these to LABEL a module entry by its single exported binding — DISPLAY only, never identity.
  exportedBindings: z.array(symbolNameContract).default([]),
  // The decomposed condition this scope's body RETURNS, present only when the scope is a boolean
  // predicate whose whole body is `return <comparison>` (`function tooBig(n){ return n > 50 }`). It is
  // what a caller's opaque `if (tooBig(x))` leaf composes against: the callee's comparison, rebased
  // onto the argument the caller passed. Absent for any body that is not a single comparison return —
  // a bare `return flag`, `return "x"`, or a call — so a leaf that could not be composed anyway is
  // never offered a signature to compose from.
  predicateSignature: conditionNodeContract.optional(),
});

export type ScopeRecord = z.infer<typeof scopeRecordContract>;
