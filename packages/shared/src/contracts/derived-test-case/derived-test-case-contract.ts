/**
 * PURPOSE: Contract for a derived test case — the salient, structurally-asserting case Assayer
 *   would generate for one reachable exit: the arrange bindings that set the inputs up, and the
 *   coverage ID of the exit the flow must then reach. Every value is drawn from an input domain,
 *   never from executing the code (P4).
 *
 *   `arrange` is a DISCRIMINATED union because an input is not always a parameter. A function takes
 *   its inputs positionally; a module scope takes none, yet a module that reads `process.env` takes
 *   an input all the same — the environment IS its parameter list. The two are set by entirely
 *   different acts (apply an argument vs. write a key before importing) and carry different value
 *   domains (a point in the operand's type vs. the string the environment can hold), so a single
 *   shape holding an optional `param` and an optional `name` would make "neither" and "both"
 *   representable and push the decision to whichever reader guessed. Discriminating on `kind` makes
 *   the wrong shape fail to parse instead.
 *
 * USAGE:
 * derivedTestCaseContract.parse({
 *   reachesExit: 'formatGreeting/return@if-then',
 *   arrange: [{ kind: 'param', param: 'name', value: '' }],
 * });
 * derivedTestCaseContract.parse({
 *   reachesExit: 'the module scope exit id',
 *   arrange: [{ kind: 'env', name: 'VALUE', value: '6' }],
 * });
 * // Returns a validated DerivedTestCase (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { envValueContract } from '../env-value/env-value-contract';
import { envVarNameContract } from '../env-var-name/env-var-name-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';

export const derivedTestCaseContract = z.object({
  reachesExit: coverageIdContract,
  arrange: z.array(
    z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('param'),
        param: symbolNameContract,
        value: representativeValueContract,
      }),
      z.object({
        kind: z.literal('env'),
        name: envVarNameContract,
        value: envValueContract,
      }),
    ]),
  ),
});

export type DerivedTestCase = z.infer<typeof derivedTestCaseContract>;
