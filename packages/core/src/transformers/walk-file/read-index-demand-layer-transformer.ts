/**
 * PURPOSE: Reads an array indexing operation (.at or []) on an AST node — determining whether an
 *   input parameter is used as an index, or an array parameter's length flows into an index of an
 *   array literal. Produces an IndexDemand so test cases cover in-bounds and out-of-bounds boundaries.
 *
 * USAGE:
 * readIndexDemandLayerTransformer({ node });
 * // Returns an IndexDemand or undefined
 */
import { Node } from '#gateway/npm/ts-morph';
import type { PropertyAccessExpression } from '#gateway/npm/ts-morph';

import { indexDemandContract } from '../../contracts/index-demand/index-demand-contract';
import type { IndexDemand } from '../../contracts/index-demand/index-demand-contract';

const AT_METHOD_NAME = 'at';
const LENGTH_PROPERTY_NAME = 'length';
const MIN_OUT_OF_BOUNDS_TARGET_LENGTH = 3;

export const readIndexDemandLayerTransformer = ({
  node,
}: {
  node: Node;
}): IndexDemand | undefined => {
  const operationInfo = ((): { operation: 'at' | 'bracket'; receiver: Node; indexArg: Node } | undefined => {
    if (Node.isCallExpression(node)) {
      const callee = node.getExpression();

      if (Node.isPropertyAccessExpression(callee) && callee.getName() === AT_METHOD_NAME) {
        const [firstArg] = node.getArguments();

        if (firstArg !== undefined) {
          return { operation: 'at', receiver: callee.getExpression(), indexArg: firstArg };
        }
      }
    } else if (Node.isElementAccessExpression(node)) {
      const indexArg = node.getArgumentExpression();

      if (indexArg !== undefined) {
        return { operation: 'bracket', receiver: node.getExpression(), indexArg };
      }
    }

    return undefined;
  })();

  if (operationInfo === undefined) {
    return undefined;
  }

  const { operation, receiver, indexArg } = operationInfo;

  if (Node.isIdentifier(indexArg)) {
    const [declaration, ...rest] = indexArg.getSymbol()?.getDeclarations() ?? [];

    if (declaration !== undefined && rest.length === 0 && Node.isParameterDeclaration(declaration)) {
      return indexDemandContract.parse({
        kind: 'param-index',
        param: declaration.getName(),
        operation,
      });
    }
  }

  const lengthAccess = ((): PropertyAccessExpression | undefined => {
    if (Node.isIdentifier(indexArg)) {
      const [declaration, ...rest] = indexArg.getSymbol()?.getDeclarations() ?? [];

      if (declaration !== undefined && rest.length === 0 && Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer();

        if (
          initializer !== undefined &&
          Node.isPropertyAccessExpression(initializer) &&
          initializer.getName() === LENGTH_PROPERTY_NAME
        ) {
          return initializer;
        }
      }
    } else if (Node.isPropertyAccessExpression(indexArg) && indexArg.getName() === LENGTH_PROPERTY_NAME) {
      return indexArg;
    }

    return undefined;
  })();

  if (lengthAccess !== undefined) {
    const [arrayDecl, ...arrayRest] = lengthAccess.getExpression().getSymbol()?.getDeclarations() ?? [];

    if (arrayDecl !== undefined && arrayRest.length === 0 && Node.isParameterDeclaration(arrayDecl)) {
      const targetLength = ((): number | undefined => {
        if (Node.isArrayLiteralExpression(receiver)) {
          return receiver.getElements().length;
        }

        if (Node.isIdentifier(receiver)) {
          const [receiverDecl, ...receiverRest] = receiver.getSymbol()?.getDeclarations() ?? [];

          if (receiverDecl !== undefined && receiverRest.length === 0 && Node.isVariableDeclaration(receiverDecl)) {
            const receiverInit = receiverDecl.getInitializer();

            if (receiverInit !== undefined && Node.isArrayLiteralExpression(receiverInit)) {
              return receiverInit.getElements().length;
            }
          }
        }

        return undefined;
      })();

      if (targetLength !== undefined && targetLength >= MIN_OUT_OF_BOUNDS_TARGET_LENGTH) {
        return indexDemandContract.parse({
          kind: 'array-length-index',
          arrayParam: arrayDecl.getName(),
          targetLength,
          operation,
        });
      }
    }
  }

  return undefined;
};
