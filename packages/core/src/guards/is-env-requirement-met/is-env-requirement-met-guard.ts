/**
 * PURPOSE: Answers whether one candidate input for an environment variable, a string or the variable
 *   left unset, puts one of its reads on the arm a case wants. `env-encode` runs the steps BACKWARDS to
 *   pick an input for one read. This runs them FORWARD on a picked input and tests the predicate on the
 *   result, so `env-solve` can check one input against every read of the variable in the case. Two
 *   reads through different steps can want inputs that do not agree.
 *
 *   It runs the analyzer's own model of each step, the plain JavaScript meaning of `??`, `Number`,
 *   `===`, `split`, and the ternary a `guard` stands for, and never the code under test, so no expected
 *   value comes from it (P4). `Number('abc')` is `NaN` and fails `> 5`, and an unset variable fails
 *   `.length`, exactly as the code would. A `guard` keeps an unset variable `undefined` and skips the
 *   steps it holds, up to the `default` that replaces the `undefined`, or to the end of the chain. `map`
 *   keeps only the array's length, because the steps do not record the function it applies, and a
 *   length is the only fact a case asks of the result.
 *
 *   A step that would throw (a `split` on an unset variable) meets nothing: the case would throw before
 *   the branch. An `unrecognized` predicate is met by anything, because there is nothing it could
 *   contradict, and a branch built on one is never steered in the first place.
 *
 * USAGE:
 * isEnvRequirementMetGuard({ steps: [{ kind: 'number' }], predicate: { kind: 'gt', literal: 5 }, want: true, raw: '6' });
 * // Returns true — Number('6') > 5
 */
import type { EnvStep, Predicate } from '@assayer/shared/contracts';

export const isEnvRequirementMetGuard = ({
  steps,
  predicate,
  want,
  raw,
}: {
  steps?: readonly EnvStep[];
  predicate?: Predicate;
  want?: boolean;
  raw?: unknown;
}): boolean => {
  if (steps === undefined || predicate === undefined || want === undefined) {
    return false;
  }

  const [step, ...rest] = steps;

  // One step at a time, on what the steps before it built. `raw` is that value, and `undefined` is the
  // variable left unset.
  if (step !== undefined) {
    switch (step.kind) {
      case 'guard': {
        const resume = rest.findIndex((later) => later.kind === 'default');

        return raw === undefined
          ? isEnvRequirementMetGuard({ steps: resume === -1 ? [] : rest.slice(resume), predicate, want })
          : isEnvRequirementMetGuard({ steps: rest, predicate, want, raw });
      }
      case 'default':
        return isEnvRequirementMetGuard({ steps: rest, predicate, want, raw: raw ?? step.value });
      case 'number':
        return isEnvRequirementMetGuard({ steps: rest, predicate, want, raw: Number(raw) });
      case 'equals':
        return isEnvRequirementMetGuard({ steps: rest, predicate, want, raw: (raw === step.literal) !== step.negated });
      case 'split':
        return typeof raw === 'string' && isEnvRequirementMetGuard({ steps: rest, predicate, want, raw: raw.split(step.separator) });
      case 'map':
      default:
        return (
          Array.isArray(raw) &&
          isEnvRequirementMetGuard({ steps: rest, predicate, want, raw: Array.from({ length: raw.length }, () => undefined) })
        );
    }
  }

  const value = raw;
  const { literal } = predicate;
  const length = typeof value === 'string' || Array.isArray(value) ? value.length : undefined;
  // A relation between two strings is the string ordering; any other pair compares as numbers, which
  // is how JavaScript itself compares a number with anything.
  const order =
    typeof value === 'string' && typeof literal === 'string'
      ? { left: value, right: literal }
      : { left: Number(value), right: Number(literal) };
  const threshold = Number(literal);

  switch (predicate.kind) {
    case 'eq':
      return (value === literal) === want;
    case 'neq':
      return (value !== literal) === want;
    case 'gt':
      return (order.left > order.right) === want;
    case 'gte':
      return (order.left >= order.right) === want;
    case 'lt':
      return (order.left < order.right) === want;
    case 'lte':
      return (order.left <= order.right) === want;
    case 'length-eq':
      return length !== undefined && (length === threshold) === want;
    case 'length-neq':
      return length !== undefined && (length !== threshold) === want;
    case 'length-gt':
      return length !== undefined && (length > threshold) === want;
    case 'length-gte':
      return length !== undefined && (length >= threshold) === want;
    case 'length-lt':
      return length !== undefined && (length < threshold) === want;
    case 'length-lte':
      return length !== undefined && (length <= threshold) === want;
    case 'truthy':
      return Boolean(value) === want;
    case 'falsy':
      return !value === want;
    case 'non-nullish':
      return (value !== undefined && value !== null) === want;
    case 'undefined-eq':
      return (value === undefined) === want;
    case 'undefined-neq':
      return (value !== undefined) === want;
    case 'typeof-eq':
      return (typeof value === literal) === want;
    case 'typeof-neq':
      return (typeof value !== literal) === want;
    case 'unrecognized':
    default:
      return true;
  }
};
