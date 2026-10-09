/**
 * PURPOSE: The values an environment-read operand can hold AT ALL, whatever the environment says,
 *   read off its steps alone. `cause-arrange` starts the operand's domain from this before any guard
 *   narrows it, the same way it starts a welded constant from its one value. A guard that wants a
 *   value outside it intersects to nothing, so that arm is reported as unreachable rather than given
 *   a case that could never reach it.
 *
 *   Two facts limit an operand:
 *   - A chain that ends in a value is non-nullish. A fallback, a coercion, a comparison and a split all
 *     return one. Only the raw read, and a `guard` with no fallback after it, are `undefined` when the
 *     variable is unset (`is-env-steps-nullable`), so neither limits null.
 *   - `x.split(s)` always returns at least one item, even for an empty string (`''.split(',')` is
 *     `['']`), and `map` keeps that length. So an operand built by `split` has a length of at least 1.
 *
 *   A chain that can hold `undefined` limits nothing a case can set, so it answers `undefined`.
 *
 * USAGE:
 * envStepsDomainTransformer({ steps: [{ kind: 'split', separator: ',' }] });
 * // Returns { lengthMin: 1, excluded: [null], … } — a split array is never empty and never null
 */
import type { EnvStep } from '@assayer/shared/contracts';

import { isEnvStepsNullableGuard } from '../../guards/is-env-steps-nullable/is-env-steps-nullable-guard';
import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';

export const envStepsDomainTransformer = ({ steps }: { steps: readonly EnvStep[] }): ValueDomain | undefined =>
  isEnvStepsNullableGuard({ steps })
    ? undefined
    : valueDomainContract.parse({
        excluded: [null],
        ...(steps.some((step) => step.kind === 'split') ? { lengthMin: 1 } : {}),
      });
