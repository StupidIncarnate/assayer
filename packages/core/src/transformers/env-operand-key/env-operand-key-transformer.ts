/**
 * PURPOSE: Names one environment-read operand by the read and the steps applied to it, rendered as the
 *   expression a reader would write: `process.env.MODE`, `Number(process.env.VALUE)`,
 *   `(process.env.V === undefined ? undefined : Number(process.env.V))`. Two operands with the same
 *   name hold the same value in every case.
 *
 *   `cause-arrange` keys an environment operand's value domain by it, so every leaf that reads the same
 *   variable through the same steps narrows ONE domain, whether the code reads it in place or through
 *   a `const`. Two different chains on one variable live in different value spaces (a string, a
 *   number), so they get two names and two domains, and `env-solve` reconciles them. It is also the
 *   name an admission prints for a variable read in place, where no binding names it.
 *
 *   It is rendered from the variable's NAME and each step's literal VALUES, never from source text, so
 *   quote style and spacing never change it.
 *
 * USAGE:
 * envOperandKeyTransformer({ name: 'VALUE', steps: [{ kind: 'number' }] });
 * // Returns 'Number(process.env.VALUE)'
 */
import type { EnvStep } from '@assayer/shared/contracts';

import { envSourceStatics } from '../../statics/env-source/env-source-statics';

export const envOperandKeyTransformer = ({
  name,
  steps,
  from,
}: {
  name: string;
  steps: readonly EnvStep[];
  from?: string;
}): string => {
  const read = `${envSourceStatics.global}.${envSourceStatics.property}.${name}`;
  const [first, ...rest] = steps;

  // A `guard` is always the first step, and it holds the steps after it until a `default` replaces the
  // `undefined` it keeps, or to the end of the chain. That span renders as the ternary the code wrote,
  // and the steps after the span apply to the ternary.
  if (first?.kind === 'guard') {
    const scopeEnd = rest.findIndex((step) => step.kind === 'default');
    const inner = scopeEnd === -1 ? rest : rest.slice(0, scopeEnd);
    const outer = scopeEnd === -1 ? [] : rest.slice(scopeEnd);

    return envOperandKeyTransformer({
      name,
      steps: outer,
      from: `(${read} === undefined ? undefined : ${envOperandKeyTransformer({ name, steps: inner })})`,
    });
  }

  return steps.reduce((rendered, step) => {
    switch (step.kind) {
      case 'default':
        return `(${rendered} ?? ${JSON.stringify(step.value)})`;
      case 'number':
        return `${envSourceStatics.coercion}(${rendered})`;
      case 'equals':
        return `${rendered} ${step.negated ? '!==' : '==='} ${JSON.stringify(step.literal)}`;
      case 'split':
        return `${rendered}.${envSourceStatics.methods.split}(${JSON.stringify(step.separator)})`;
      case 'map':
        return `${rendered}.${envSourceStatics.methods.map}(…)`;
      case 'guard':
      default:
        return rendered;
    }
  }, from ?? read);
};
