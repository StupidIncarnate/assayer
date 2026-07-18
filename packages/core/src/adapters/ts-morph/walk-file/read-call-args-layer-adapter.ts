/**
 * PURPOSE: Projects a call's arguments structurally — the shape a follower needs, never the value it
 *   would compute (P4). Each argument becomes one of: a `param-ref` (an identifier whose symbol is a
 *   parameter — what a caller passes straight through, and the only shape v1 can drive), a `literal`
 *   (a fixed string / number / boolean the caller welds in), or `opaque` (anything else — an
 *   expression, or an identifier that is not a parameter). A parameter is recognized by SYMBOL, so a
 *   rename never fools it and no source text enters the projection.
 *
 * USAGE:
 * readCallArgsLayerAdapter({ args: callExpression.getArguments() });
 * // Returns [{ kind: 'param-ref', paramName: 'value' }, { kind: 'literal', value: 3 }, { kind: 'opaque' }]
 */
import { Node } from 'ts-morph';

import { representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';

import type { CallArg } from '../../../contracts/call-site/call-site-contract';

export const readCallArgsLayerAdapter = ({ args }: { args: Node[] }): CallArg[] =>
  args.map((arg): CallArg => {
    if (Node.isIdentifier(arg)) {
      const [declaration, ...rest] = arg.getSymbol()?.getDeclarations() ?? [];

      return declaration !== undefined && rest.length === 0 && Node.isParameterDeclaration(declaration)
        ? { kind: 'param-ref', paramName: symbolNameContract.parse(declaration.getName()) }
        : { kind: 'opaque' };
    }

    if (Node.isStringLiteral(arg) || Node.isNumericLiteral(arg)) {
      return { kind: 'literal', value: representativeValueContract.parse(arg.getLiteralValue()) };
    }

    if (Node.isTrueLiteral(arg)) {
      return { kind: 'literal', value: representativeValueContract.parse(true) };
    }

    if (Node.isFalseLiteral(arg)) {
      return { kind: 'literal', value: representativeValueContract.parse(false) };
    }

    return { kind: 'opaque' };
  });
