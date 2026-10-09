/**
 * PURPOSE: Decides what ONE case writes into ONE environment variable, given every read of that
 *   variable the case constrains. `cause-arrange` calls it once per variable. One variable can be read
 *   through several chains in one file, in place (`process.env.V === undefined`) and through a `const`
 *   (`Number(process.env.V)`), and each chain has its own value domain, keyed by `env-operand-key`. A
 *   case can write only one input into the variable, so every read has to agree on it.
 *
 *   It takes each read's own answer from `env-encode` as a candidate, in the order the reads appear,
 *   and writes the first candidate that meets EVERY read (`is-env-requirement-met`). A `null` answer is
 *   the variable left unset. Then:
 *   - no read could encode anything: `unencodable`, and the case writes no variable;
 *   - one read needs the variable unset and another read fails on an unset variable: `unreachable`,
 *     because no input meets both (`is-env-unset-only` makes that a proof);
 *   - every candidate missed some read, without a proof: `unsolved`, and the case is dropped. Another
 *     string might still meet every read, so nothing is claimed about the code.
 *
 *   Every candidate comes from a domain and the steps, never from running the code (P4).
 *
 * USAGE:
 * envSolveTransformer({ requirements: cause.requirements, domains });
 * // Returns { kind: 'unset' } when `process.env.V === undefined` must hold and `V ?? 0` is falsy
 */
import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import { envSolutionContract } from '../../contracts/env-solution/env-solution-contract';
import type { EnvSolution } from '../../contracts/env-solution/env-solution-contract';
import { isEnvRequirementMetGuard } from '../../guards/is-env-requirement-met/is-env-requirement-met-guard';
import { isEnvUnsetOnlyGuard } from '../../guards/is-env-unset-only/is-env-unset-only-guard';
import { envEncodeTransformer } from '../env-encode/env-encode-transformer';
import { envOperandKeyTransformer } from '../env-operand-key/env-operand-key-transformer';

export const envSolveTransformer = ({
  requirements,
  domains,
}: {
  requirements: ConditionCause['requirements'];
  domains: ReadonlyMap<string, ValueDomain>;
}): EnvSolution => {
  const reads = requirements.flatMap((requirement) =>
    requirement.leaf.operandEnvVarName === undefined
      ? []
      : [
          {
            key: envOperandKeyTransformer({
              name: String(requirement.leaf.operandEnvVarName),
              steps: requirement.leaf.operandEnvSteps ?? [],
            }),
            steps: requirement.leaf.operandEnvSteps ?? [],
            predicate: requirement.leaf.predicate,
            type: requirement.leaf.operandType,
            want: requirement.want,
          },
        ],
  );

  // One candidate per distinct chain, in the order the reads appear, so the choice is deterministic.
  const candidates = reads
    .filter((read, index) => reads.findIndex((earlier) => earlier.key === read.key) === index)
    .flatMap((read) => {
      const encoded = envEncodeTransformer({
        steps: read.steps,
        domain: domains.get(read.key) ?? valueDomainContract.parse({}),
        type: read.type,
      });

      return encoded === undefined ? [] : [encoded];
    });

  if (candidates.length === 0) {
    return envSolutionContract.parse({ kind: 'unencodable' });
  }

  const chosen = candidates.find((candidate) =>
    reads.every((read) =>
      isEnvRequirementMetGuard({
        steps: read.steps,
        predicate: read.predicate,
        want: read.want,
        ...(candidate === null ? {} : { raw: candidate }),
      }),
    ),
  );

  if (chosen === null) {
    return envSolutionContract.parse({ kind: 'unset' });
  }

  if (chosen !== undefined) {
    return envSolutionContract.parse({ kind: 'set', value: chosen });
  }

  const contradicts =
    reads.some((read) => isEnvUnsetOnlyGuard({ steps: read.steps, predicate: read.predicate, want: read.want })) &&
    reads.some((read) => !isEnvRequirementMetGuard({ steps: read.steps, predicate: read.predicate, want: read.want }));

  return envSolutionContract.parse({ kind: contradicts ? 'unreachable' : 'unsolved' });
};
