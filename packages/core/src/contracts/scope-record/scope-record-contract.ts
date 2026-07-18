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
  entryAccessContract,
  exitNodeContract,
  lineNumberContract,
  paramDescriptorContract,
  symbolNameContract,
  typeDescriptorContract,
} from '@assayer/shared/contracts';

import { callSiteContract } from '../call-site/call-site-contract';

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
});

export type ScopeRecord = z.infer<typeof scopeRecordContract>;
