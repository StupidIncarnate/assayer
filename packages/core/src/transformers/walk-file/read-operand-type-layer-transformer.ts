/**
 * PURPOSE: Reads the type of a branch's operand — the domain a derived case must pick values from.
 *   This is the ONE owner of that rule, which previously lived twice: function scope matched the
 *   operand NAME against the enclosing params, module scope read the type graph and widened. Both
 *   survive here deliberately rather than being merged, because merging them would be a semantics
 *   change hiding inside a refactor:
 *
 *   - A param keeps its DECLARED descriptor. Widening it would collapse `'get' | 'post' | 'delete'`
 *     to `string` and destroy the exhaustive per-member fan-out that makes switch analysis useful.
 *   - Any other binding is read from the type graph and WIDENED, because `const value = 7` has the
 *     literal type `7`, and a branch tested against a domain of exactly one value yields no case.
 *
 *   Known follow-ons, deliberately not done here: resolve the operand via SYMBOL → declaration
 *   rather than by name (today a local that shadows a param reads as the param), and decide whether
 *   a provably-constant `const` should really widen at all.
 *
 * USAGE:
 * readOperandTypeLayerTransformer({ node: operandNode, context, name: 'value' });
 * // Returns the operand's TypeDescriptor, or an unknown descriptor when it cannot be read
 */
import type { Node } from '#gateway/npm/ts-morph';

import type { SymbolName, TypeDescriptor } from '@assayer/shared/contracts';

import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { typeDescriptorTransformer } from '../type-descriptor/type-descriptor-transformer';
import { readTypeFactLayerTransformer } from './read-type-fact-layer-transformer';

export const readOperandTypeLayerTransformer = ({
  node,
  context,
  name,
}: {
  node: Node;
  context: WalkContext;
  name?: SymbolName;
}): TypeDescriptor => {
  const param = name === undefined ? undefined : context.params.find((candidate) => candidate.name === name);

  if (param !== undefined) {
    return param.type;
  }

  return typeDescriptorTransformer({ fact: readTypeFactLayerTransformer({ type: node.getType(), widen: true }) });
};
