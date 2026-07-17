/**
 * PURPOSE: Reads WHERE a branch operand's value entered the program, for the one source that makes a
 *   scope nothing can call drivable anyway: the process environment. It answers the environment
 *   variable's NAME, or nothing at all.
 *
 *   It is a SIBLING of `read-operand-type`, not a change to it, because they answer different
 *   questions from different evidence. `read-operand-type` says what DOMAIN a value is drawn from and
 *   keeps both of its rules exactly as they are — the operand of `Number(process.env.VALUE)` reads as
 *   a number there for the same reason it always did, off the same type graph. This adds only the
 *   SOURCE, which no type can supply.
 *
 *   It resolves by SYMBOL, which is neither a scan nor a climb. A binding's declaration is not an
 *   ancestor of the condition that reads it and never could be — it is a sibling subtree — so there
 *   is no walk context holding the answer and none to reconstruct. Asking the checker for the
 *   identifier's declaration is the only question with an answer, and it is the direction
 *   `read-operand-type` already names as the right one.
 *
 *   THE RUNG, and why it stops here: exactly ONE hop through the `Number` coercion —
 *   `const value = Number(process.env.VALUE)`. That is the rung where the environment's string can be
 *   INVERTED back to the point a predicate wants (`Number(String(6)) === 6`), which is what lets a
 *   case CHOOSE an arm rather than merely name a variable. Everything past it stays unrecognized and
 *   therefore honestly undriven: two hops (`const raw = process.env.V; const value = Number(raw)`)
 *   need a chain of bindings the walk does not model; another coercion (`parseInt`, a hand-written
 *   parser) needs an inverse only the first of those has and none of them declare; and a bare
 *   `const mode = process.env.MODE` types as `any`, because the analyzer's project loads no ambient
 *   Node declarations, so there is no domain to pick a value from at all. Guessing an inverse instead
 *   would put a FAILING case against correct code, which reads as the analyzer being wrong.
 *
 * USAGE:
 * readEnvOperandLayerAdapter({ node: operandIdentifier });
 * // Returns 'VALUE' for `const value = Number(process.env.VALUE)`, or undefined
 */
import { Node } from 'ts-morph';

import { envVarNameContract } from '@assayer/shared/contracts';
import type { EnvVarName } from '@assayer/shared/contracts';

import { envSourceStatics } from '../../../statics/env-source/env-source-statics';

export const readEnvOperandLayerAdapter = ({ node }: { node: Node }): EnvVarName | undefined => {
  if (!Node.isIdentifier(node)) {
    return undefined;
  }

  // The operand's own declaration, via the checker. A param resolves to a ParameterDeclaration and
  // stops right here, which is what leaves the param rule in `read-operand-type` untouched.
  const [declaration, ...rest] = node.getSymbol()?.getDeclarations() ?? [];

  if (declaration === undefined || rest.length > 0 || !Node.isVariableDeclaration(declaration)) {
    return undefined;
  }

  const initializer = declaration.getInitializer();

  if (initializer === undefined || !Node.isCallExpression(initializer)) {
    return undefined;
  }

  const callee = initializer.getExpression();

  // `Number` must be the AMBIENT one — see the note on `process` below; the evidence is the same. A
  // file with its own `Number` in scope means something else by it, and `String` would not be its
  // inverse.
  if (
    !Node.isIdentifier(callee) ||
    callee.getText() !== envSourceStatics.coercion ||
    (callee.getSymbol()?.getDeclarations() ?? []).some(
      (declared) => declared.getSourceFile() === callee.getSourceFile(),
    )
  ) {
    return undefined;
  }

  const [argument, ...extraArguments] = initializer.getArguments();

  // A second argument means a coercion this does not model, whatever the callee is called:
  // `parseInt(x, 10)` is not `Number(x)`, and its inverse is not `String`.
  if (argument === undefined || extraArguments.length > 0 || !Node.isPropertyAccessExpression(argument)) {
    return undefined;
  }

  const container = argument.getExpression();

  if (!Node.isPropertyAccessExpression(container) || container.getName() !== envSourceStatics.property) {
    return undefined;
  }

  const root = container.getExpression();

  // The impostor check, and the same rule as `Number` above: the identifier must not be declared by
  // THIS file. That is the one question the checker can answer about both, because they are ambient
  // for different reasons — `Number` is declared by the standard library, while `process` is declared
  // by nothing at all here (the analyzer's project loads no Node types on purpose). What they share
  // is that neither is the file's own. So a file writing `const process = { env: … }` gives the
  // checker a declaration to find right here, and this declines rather than setting a real
  // environment variable the code never reads.
  if (
    !Node.isIdentifier(root) ||
    root.getText() !== envSourceStatics.global ||
    (root.getSymbol()?.getDeclarations() ?? []).some((declared) => declared.getSourceFile() === root.getSourceFile())
  ) {
    return undefined;
  }

  return envVarNameContract.parse(argument.getName());
};
