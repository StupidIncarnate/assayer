/**
 * PURPOSE: Reads one expression as a chain of pure steps applied to ONE `process.env.<NAME>` read,
 *   and answers the variable's name plus the steps in the order the code applies them. It answers
 *   nothing for any expression it cannot run backwards. `read-env-operand` is its only caller, and
 *   starts it at a branch operand's identifier.
 *
 *   The shapes it reads, each from node KINDS and literal VALUES (`getLiteralValue()`), never source
 *   text:
 *   - `process.env.NAME` or `process.env['NAME']`, the read itself.
 *   - `x ?? '<literal>'` on the raw read: a `default` step.
 *   - `x === undefined ? undefined : <chain>` on the raw read (or `x !== undefined ? <chain> :
 *     undefined`), where the chain reads the same variable: a `guard` step, then the chain's steps. An
 *     unset variable keeps the operand `undefined`, and the chain runs only on a set one.
 *   - `x ?? <literal>` after a `guard`, where the literal has the type the chain builds: a `default`
 *     step that replaces the `undefined` the guard keeps.
 *   - `Number(x)` on a string: a `number` step.
 *   - `x === <literal>`, `x == <literal>`, and their negations, on a string, a number or a boolean:
 *     an `equals` step. The literal may sit on either side.
 *   - `x.split('<literal>')` on a string: a `split` step.
 *   - `xs.map(f)` on an array, with exactly one argument: a `map` step.
 *   - Parentheses, which are formatting.
 *   - An identifier bound by a same-file `const`, which it follows to that `const`'s initializer.
 *     A `let` or `var` could be reassigned before the branch runs, so it stops there.
 *
 *   `read-const-binding` follows a binding by symbol, and `seen` holds every declaration already
 *   followed, so a cycle of bindings stops. `read-env-access` reads the `process.env` access itself.
 *
 *   A guard's operand can be `undefined`, so a step that would treat it as a value (`Number`, a
 *   comparison, `split`) is not read after one. Only a `??` fallback is, and after it the value is
 *   defined again.
 *
 *   `Number` must be the runtime global. The analyzer's parse resolves it to the standard library, so
 *   a file that writes its own `const Number = …` gives the checker a declaration in THIS file, and
 *   the reader declines: `String` would not be the inverse of that function.
 *
 * USAGE:
 * readEnvChainLayerTransformer({ node: initializer, seen: [] });
 * // Returns { name: 'RECEIVER', steps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }] }
 * //   for `(process.env.RECEIVER ?? '').split(',')`, or undefined
 */
import { Node, SyntaxKind } from '#gateway/npm/ts-morph';

import { envStepContract } from '@assayer/shared/contracts';

import { envOperandReadoutContract } from '../../contracts/env-operand-readout/env-operand-readout-contract';
import type { EnvOperandReadout } from '../../contracts/env-operand-readout/env-operand-readout-contract';
import { envSourceStatics } from '../../statics/env-source/env-source-statics';
import { isEnvStepsNullableGuard } from '../../guards/is-env-steps-nullable/is-env-steps-nullable-guard';
import { envStepsTypeTransformer } from '../env-steps-type/env-steps-type-transformer';
import { readConstBindingLayerTransformer } from './read-const-binding-layer-transformer';
import { readEnvAccessLayerTransformer } from './read-env-access-layer-transformer';
import { readEnvGuardLayerTransformer } from './read-env-guard-layer-transformer';
import { readLiteralValueLayerTransformer } from './read-literal-value-layer-transformer';

const EQUALITY_OPERATORS = new Set([SyntaxKind.EqualsEqualsEqualsToken, SyntaxKind.EqualsEqualsToken]);
const INEQUALITY_OPERATORS = new Set([SyntaxKind.ExclamationEqualsEqualsToken, SyntaxKind.ExclamationEqualsToken]);

export const readEnvChainLayerTransformer = ({
  node,
  seen,
}: {
  node: Node;
  seen: readonly Node[];
}): EnvOperandReadout | undefined => {
  if (Node.isParenthesizedExpression(node)) {
    return readEnvChainLayerTransformer({ node: node.getExpression(), seen });
  }

  if (Node.isIdentifier(node)) {
    const declaration = readConstBindingLayerTransformer({ node, seen });
    const initializer = declaration?.getInitializer();

    return declaration === undefined || initializer === undefined
      ? undefined
      : readEnvChainLayerTransformer({ node: initializer, seen: [...seen, declaration] });
  }

  const access = readEnvAccessLayerTransformer({ node });

  if (access !== undefined) {
    return access;
  }

  // `x === undefined ? undefined : <chain>` (`read-env-guard`), where `x` is the raw read and the chain
  // reads the SAME variable.
  const guarded = readEnvGuardLayerTransformer({ node });

  if (guarded !== undefined) {
    const read = readEnvChainLayerTransformer({ node: guarded.tested, seen });
    const chain = readEnvChainLayerTransformer({ node: guarded.setArm, seen });

    return read === undefined ||
      read.steps.length > 0 ||
      chain?.name !== read.name ||
      chain.steps.some((step) => step.kind === 'guard')
      ? undefined
      : envOperandReadoutContract.parse({ name: read.name, steps: [envStepContract.parse({ kind: 'guard' }), ...chain.steps] });
  }

  if (Node.isBinaryExpression(node)) {
    const operator = node.getOperatorToken().getKind();
    const left = node.getLeft();
    const right = node.getRight();

    // `x ?? <literal>` only where `x` can be undefined: the raw read, with a string fallback, or a
    // guard, with a fallback of the type the guarded chain builds. Every other step already returns a
    // value, so a fallback there would never run.
    if (operator === SyntaxKind.QuestionQuestionToken) {
      const inner = readEnvChainLayerTransformer({ node: left, seen });
      const fallback = readLiteralValueLayerTransformer({ node: right });
      const built = inner === undefined ? undefined : envStepsTypeTransformer({ steps: inner.steps.filter((step) => step.kind !== 'guard') });

      return inner === undefined ||
        fallback === undefined ||
        fallback === null ||
        !isEnvStepsNullableGuard({ steps: inner.steps }) ||
        built?.kind !== typeof fallback
        ? undefined
        : envOperandReadoutContract.parse({
            name: inner.name,
            steps: [...inner.steps, envStepContract.parse({ kind: 'default', value: fallback })],
          });
    }

    if (!EQUALITY_OPERATORS.has(operator) && !INEQUALITY_OPERATORS.has(operator)) {
      return undefined;
    }

    // The literal may sit on either side, so try the chain on the left first, then on the right.
    const leftLiteral = readLiteralValueLayerTransformer({ node: left });
    const [chainNode, literal] = leftLiteral === undefined ? [left, readLiteralValueLayerTransformer({ node: right })] : [right, leftLiteral];
    const inner = readEnvChainLayerTransformer({ node: chainNode, seen });

    if (inner === undefined || literal === undefined || literal === null) {
      return undefined;
    }

    const innerKind = envStepsTypeTransformer({ steps: inner.steps }).kind;

    // A guard's `undefined` would be compared too, which the guard step cannot express, so a comparison
    // is read only on a chain that holds a value. The raw read is the one nullable chain it accepts,
    // because an unset variable is simply not equal to the literal.
    return innerKind === 'array' || (inner.steps.length > 0 && isEnvStepsNullableGuard({ steps: inner.steps }))
      ? undefined
      : envOperandReadoutContract.parse({
          name: inner.name,
          steps: [
            ...inner.steps,
            envStepContract.parse({ kind: 'equals', literal, negated: INEQUALITY_OPERATORS.has(operator) }),
          ],
        });
  }

  if (!Node.isCallExpression(node)) {
    return undefined;
  }

  const callee = node.getExpression();
  const [argument, ...extraArguments] = node.getArguments();

  // A second argument means a call this does not model, whatever the callee is called:
  // `parseInt(x, 10)` is not `Number(x)`, and `split(',', 2)` caps the length.
  if (argument === undefined || extraArguments.length > 0) {
    return undefined;
  }

  // `Number(x)`, where `Number` is the ambient one. A file with its own `Number` in scope means
  // something else by it, and `String` would not be its inverse.
  if (Node.isIdentifier(callee)) {
    if (
      callee.getText() !== envSourceStatics.coercion ||
      (callee.getSymbol()?.getDeclarations() ?? []).some((declared) => declared.getSourceFile() === callee.getSourceFile())
    ) {
      return undefined;
    }

    const inner = readEnvChainLayerTransformer({ node: argument, seen });

    return inner === undefined || envStepsTypeTransformer({ steps: inner.steps }).kind !== 'string'
      ? undefined
      : envOperandReadoutContract.parse({ name: inner.name, steps: [...inner.steps, envStepContract.parse({ kind: 'number' })] });
  }

  if (!Node.isPropertyAccessExpression(callee)) {
    return undefined;
  }

  const inner = readEnvChainLayerTransformer({ node: callee.getExpression(), seen });

  if (inner === undefined) {
    return undefined;
  }

  const innerKind = envStepsTypeTransformer({ steps: inner.steps }).kind;
  const method = callee.getName();

  if (method === envSourceStatics.methods.split) {
    const separator = readLiteralValueLayerTransformer({ node: argument });

    return innerKind !== 'string' || typeof separator !== 'string' || separator.length === 0
      ? undefined
      : envOperandReadoutContract.parse({
          name: inner.name,
          steps: [...inner.steps, envStepContract.parse({ kind: 'split', separator })],
        });
  }

  return method === envSourceStatics.methods.map && innerKind === 'array'
    ? envOperandReadoutContract.parse({ name: inner.name, steps: [...inner.steps, envStepContract.parse({ kind: 'map' })] })
    : undefined;
};
