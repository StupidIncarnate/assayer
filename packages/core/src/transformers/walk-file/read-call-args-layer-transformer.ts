/**
 * PURPOSE: Projects a call's arguments structurally — the shape a follower needs, never the value it
 *   would compute (P4). Each argument becomes one of: a `param-ref` (an identifier whose symbol is a
 *   parameter — what a caller passes straight through, and the only shape v1 can drive), a `literal`
 *   (a fixed string / number / boolean the caller welds in), an inline `callback`, an `fn-ref` (a bare
 *   identifier the checker resolves to an IMPORT or a same-file `local` function — `items.map(fn)`,
 *   which the cross-file-map overlay funnels through), or `opaque` (anything else — an arbitrary
 *   expression, or an identifier that is neither a parameter nor a nameable callee). A parameter and a
 *   callee are recognized by SYMBOL, so a rename never fools them and no source text enters the
 *   projection.
 *
 * USAGE:
 * readCallArgsLayerAdapter({ args: callExpression.getArguments() });
 * // Returns [{ kind: 'param-ref', paramName: 'value' }, { kind: 'literal', value: 3 }, { kind: 'opaque' }]
 */
import { Node } from '#gateway/npm/ts-morph';

import { lineNumberContract, representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';

import type { CallArg } from '../../contracts/call-site/call-site-contract';
import { readCalleeLayerTransformer } from './read-callee-layer-transformer';

export const readCallArgsLayerTransformer = ({ args }: { args: Node[] }): CallArg[] =>
  args.map((arg): CallArg => {
    if (Node.isIdentifier(arg)) {
      const [declaration, ...rest] = arg.getSymbol()?.getDeclarations() ?? [];

      if (declaration !== undefined && rest.length === 0 && Node.isParameterDeclaration(declaration)) {
        return { kind: 'param-ref', paramName: symbolNameContract.parse(declaration.getName()) };
      }

      // A bare identifier the checker resolves to a nameable callee — an imported binding or a same-file
      // function declaration — is a FUNCTION REFERENCE passed by name (`items.map(bandReading)`), read
      // through the SAME callee resolver a call site uses. Anything the resolver cannot name (a local
      // const, a variable) comes back `unresolved` and stays `opaque`, exactly as before.
      const callee = readCalleeLayerTransformer({ callee: arg });

      return callee.target === 'unresolved' ? { kind: 'opaque' } : { kind: 'fn-ref', callee };
    }

    // An inline function-like argument is a scope the walk opens elsewhere; record the LINK by its
    // start line (the key `follow-calls` matches a scope record by), so a callback the code genuinely
    // reaches is never mistaken for dead surface.
    if (Node.isArrowFunction(arg) || Node.isFunctionExpression(arg)) {
      return { kind: 'callback', startLine: lineNumberContract.parse(arg.getStartLineNumber()) };
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
