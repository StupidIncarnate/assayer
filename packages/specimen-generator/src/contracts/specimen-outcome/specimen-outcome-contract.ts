/**
 * PURPOSE: What happens when Assayer analyzes and runs one specimen file. The generator writes it
 * as a prediction from its configs, and the observe step fills it from Assayer's real output. One
 * shape serves both, so a generated test compares like with like.
 *
 * USAGE:
 * specimenOutcomeContract.parse({ branches: [{ kind: 'if', line: 2, driven: 'both-ways' }], caseFailures: [], lints: [], undriven: [], darkSpots: [], gaps: [] });
 * // Returns a SpecimenOutcome
 */
import { z } from '#gateway/npm/zod';

export const specimenOutcomeContract = z
  .object({
    branches: z.array(
      z
        .object({
          kind: z.enum(['if', 'switch', 'ternary']),
          line: z.number().int().positive().brand<'SpecimenOutcomeBranchesLine'>(),
          driven: z.enum(['both-ways', 'one-way', 'never']),
        })
        .brand<'SpecimenOutcomeBranches'>(),
    ),
    caseFailures: z.array(
      z
        .object({
          status: z.enum(['failed', 'errored']),
          message: z.string().brand<'SpecimenOutcomeCaseFailuresMessage'>(),
        })
        .brand<'SpecimenOutcomeCaseFailures'>(),
    ),
    lints: z.array(
      z
        .object({
          rule: z.enum(['dead-surface', 'unreachable-exit']),
          startLine: z.number().int().positive().brand<'SpecimenOutcomeLintsStartLine'>(),
        })
        .brand<'SpecimenOutcomeLints'>(),
    ),
    undriven: z.array(
      z
        .object({
          startLine: z.number().int().positive().brand<'SpecimenOutcomeUndrivenStartLine'>(),
        })
        .brand<'SpecimenOutcomeUndriven'>(),
    ),
    darkSpots: z.array(
      z
        .object({
          startLine: z.number().int().positive().brand<'SpecimenOutcomeDarkSpotsStartLine'>(),
        })
        .brand<'SpecimenOutcomeDarkSpots'>(),
    ),
    gaps: z.array(
      z
        .object({
          name: z.string().min(1).brand<'SpecimenOutcomeGapsName'>(),
        })
        .brand<'SpecimenOutcomeGaps'>(),
    ),
  })
  .brand<'SpecimenOutcome'>();

export type SpecimenOutcome = z.infer<typeof specimenOutcomeContract>;
