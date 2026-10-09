/**
 * PURPOSE: Answers whether an environment-read operand can hold `undefined`, read off its steps alone.
 *   That is exactly the case where a case leaving the variable UNSET reaches the operand as `undefined`:
 *   the raw read itself, and a chain whose last `guard` (`x === undefined ? undefined : …`) has no
 *   `default` after it. A coercion, a comparison, a split and a fallback all return a value, so a
 *   chain ending in one of them never holds `undefined`.
 *
 *   `is-predicate-constraining` asks it before it lets an `undefined` comparison steer a branch, and
 *   `env-encode` asks it before it answers "leave the variable unset" for the nullish point.
 *
 * USAGE:
 * isEnvStepsNullableGuard({ steps: [{ kind: 'guard' }, { kind: 'number' }] });
 * // Returns true — `process.env.V === undefined ? undefined : Number(process.env.V)` is undefined when V is unset
 */
import type { EnvStep } from '@assayer/shared/contracts';

export const isEnvStepsNullableGuard = ({ steps }: { steps?: readonly EnvStep[] }): boolean => {
  if (steps === undefined) {
    return false;
  }

  const kinds = steps.map((step) => step.kind);

  return steps.length === 0 || kinds.lastIndexOf('guard') > kinds.lastIndexOf('default');
};
