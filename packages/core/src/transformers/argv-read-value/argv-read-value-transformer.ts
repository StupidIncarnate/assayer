/**
 * PURPOSE: Runs a command-line read and its steps FORWARD, and answers the value the operand holds
 *   when a case runs. The answer is a list: one entry holding the value when Assayer knows it, or an
 *   empty list when it does not. A list is used because `undefined` is itself a value an argv read
 *   holds, so it cannot also mean "not known".
 *
 *   The value is known because of how the run worker starts. `forkWorker` starts it with no
 *   command-line arguments of its own, so its argv holds only the Node binary and the worker's entry
 *   file (`envSourceStatics.argv.runnerLength`). Every entry from that index on is absent:
 *   `process.argv[2]` is `undefined`, and `process.argv.slice(2)` is `[]`. An entry before that index
 *   is a path Assayer does not predict, so it is not known.
 *
 *   Each step runs as the code runs it. A step that would throw at run time, such as `split` on an
 *   absent entry, leaves the value not known, and so does `map` over a list with entries, whose
 *   callback this does not run.
 *
 * USAGE:
 * argvReadValueTransformer({ read: { shape: 'element', index: 2, steps: [{ kind: 'number' }] } });
 * // Returns [NaN], the value of `Number(process.argv[2])` in the run worker
 */
import type { ArgvRead } from '@assayer/shared/contracts';

import { envSourceStatics } from '../../statics/env-source/env-source-statics';

export const argvReadValueTransformer = ({ read }: { read: ArgvRead }): readonly unknown[] => {
  if (read.index < envSourceStatics.argv.runnerLength) {
    return [];
  }

  const start: unknown = read.shape === 'element' ? undefined : [];

  // `skipping` is true after a `guard` meets an absent entry: the guarded steps do not run, and the
  // operand stays `undefined` until a `default` replaces it.
  const ran = read.steps.reduce<{ known: readonly unknown[]; skipping: boolean }>(
    ({ known, skipping }, step) => {
      if (known.length === 0) {
        return { known, skipping };
      }

      const [value] = known;

      switch (step.kind) {
        case 'guard':
          return { known, skipping: value === undefined };
        case 'default':
          return value === undefined ? { known: [step.value], skipping: false } : { known, skipping };
        case 'number':
          return skipping ? { known, skipping } : { known: [Number(value)], skipping };
        case 'equals':
          return skipping ? { known, skipping } : { known: [(value === step.literal) !== step.negated], skipping };
        case 'split':
          return skipping
            ? { known, skipping }
            : { known: typeof value === 'string' ? [value.split(step.separator)] : [], skipping };
        case 'map':
        default:
          return skipping
            ? { known, skipping }
            : { known: Array.isArray(value) && value.length === 0 ? [[]] : [], skipping };
      }
    },
    { known: [start], skipping: false },
  );

  return ran.known;
};
