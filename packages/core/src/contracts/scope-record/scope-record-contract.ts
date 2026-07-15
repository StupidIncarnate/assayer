/**
 * PURPOSE: Contract for a scope record — ONE executable scope the walk found (a module's top level
 *   or a function-like: declaration, arrow, expression, method, constructor, accessor), carrying the
 *   scope path that owns it, its signature, whether it is reachable from an export, and the branch
 *   and exit nodes that belong to it. Classes contribute a path SEGMENT but no record: they hold no
 *   control flow of their own. Nesting is expressed in `scopePath`, never by containment — the walk
 *   is a tree but its output is a FLAT list of entry-rooted records, so a nested function is a
 *   sibling record with a longer path and every downstream consumer reads one uniform shape.
 *
 * USAGE:
 * scopeRecordContract.parse({
 *   scopePath: ['Classifier', 'classify'], name: 'classify', kind: 'function', exported: true,
 *   params: [{ name: 'value', type: { kind: 'number' } }], returnType: { kind: 'string' },
 *   line: 2, branches: [], exits: [],
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

export const scopeRecordContract = z.object({
  scopePath: z.array(symbolNameContract),
  name: symbolNameContract,
  kind: z.enum(['module', 'function']).brand<'ScopeKind'>(),
  exported: z.boolean(),
  access: entryAccessContract,
  params: z.array(paramDescriptorContract),
  returnType: typeDescriptorContract,
  line: lineNumberContract,
  branches: z.array(branchNodeContract),
  exits: z.array(exitNodeContract),
});

export type ScopeRecord = z.infer<typeof scopeRecordContract>;
