/**
 * PURPOSE: Reads every default value one parameter declares, in the order they run. The parameter's
 *   own default (`n = 1`) comes first. A destructured parameter then runs the default of each element
 *   it unpacks (`{ a = 1 }`, `[a = 1]`), and a nested pattern runs its own after the element's.
 *
 *   `handle-function` descends each one under the function's own context, so a ternary in any of them
 *   is a branch of that function.
 *
 * USAGE:
 * readParameterDefaultsLayerTransformer({ node: parameter });
 * // Returns [the initializer of `a = c ? 1 : 2`] for the parameter `{ a = c ? 1 : 2 }: { a?: number }`
 */
import { Node } from '#gateway/npm/ts-morph';
import type { Expression } from '#gateway/npm/ts-morph';

export const readParameterDefaultsLayerTransformer = ({ node }: { node: Node }): Expression[] => {
  if (Node.isParameterDeclaration(node) || Node.isBindingElement(node)) {
    const initializer = node.getInitializer();
    const own = initializer === undefined ? [] : [initializer];

    return [...own, ...readParameterDefaultsLayerTransformer({ node: node.getNameNode() })];
  }

  if (Node.isObjectBindingPattern(node) || Node.isArrayBindingPattern(node)) {
    return node.getElements().flatMap((element) => readParameterDefaultsLayerTransformer({ node: element }));
  }

  return [];
};
