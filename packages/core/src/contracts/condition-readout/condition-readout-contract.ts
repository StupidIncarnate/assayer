/**
 * PURPOSE: What `readConditionLayerTransformer` reads off one comparison: the operand node, the
 *   operand's name or object-member root and property path, the root parameter's declared
 *   type-reference name, whether the comparison is a `typeof` read, and the classified predicate.
 *   The operand is a live ts-morph node, which Zod cannot check, so this file holds a type and no
 *   schema.
 *
 * USAGE:
 * const readout: ConditionReadout = readConditionLayerTransformer({ condition });
 * // Returns { operandNode, operandName: 'name', predicate: { kind: 'length-eq', literal: 0 } }
 */
import type { Node } from '#gateway/npm/ts-morph';

import type { Predicate } from '@assayer/shared/contracts';

export interface ConditionReadout {
  operandNode: Node;
  operandName?: string;
  operandRootName?: string;
  operandPropertyPath?: string[];
  operandTypeRef?: string;
  operandIsTypeof?: true;
  predicate: Predicate;
}
