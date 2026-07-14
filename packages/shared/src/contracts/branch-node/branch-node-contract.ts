/**
 * PURPOSE: Contract for a branch node — a conditional construct (if/switch/ternary) in an entry,
 *   carrying its cache-internal coverage ID (the whole condition's structural projection), the
 *   operand parameter under test and its type, the parsed predicate, and its rendered line span.
 *   Identity is fully AST-derived — no source-text field.
 *
 * USAGE:
 * branchNodeContract.parse({
 *   coverageId: 'formatGreeting/if:BinaryExpression,id:name,…', kind: 'if',
 *   operandParamName: 'name', operandType: { kind: 'string' }, predicate: { kind: 'length-eq-zero' },
 *   startLine: 2, endLine: 4,
 * });
 * // Returns a validated BranchNode (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';
import { predicateContract } from '../predicate/predicate-contract';
import { lineNumberContract } from '../line-number/line-number-contract';

export const branchNodeContract = z.object({
  coverageId: coverageIdContract,
  kind: z.enum(['if', 'switch', 'ternary']).brand<'BranchKind'>(),
  operandParamName: symbolNameContract.optional(),
  operandType: typeDescriptorContract,
  predicate: predicateContract,
  startLine: lineNumberContract,
  endLine: lineNumberContract,
});

export type BranchNode = z.infer<typeof branchNodeContract>;
