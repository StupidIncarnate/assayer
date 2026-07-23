/**
 * PURPOSE: Contract for a derived test case — one structurally-asserting case Assayer would generate
 *   for a reachable exit: the arrange bindings that set the inputs up, and the coverage ID of the
 *   exit the flow must then reach. Every value is drawn from an input domain, never from executing
 *   the code (P4).
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
 *   An `object` arrange is a whole PARAMETER too, but its inner shape is arranged per property: when a
 *   branch turns on `config.mode`, the case sets `config` to an object whose properties carry the stub
 *   values that steer each arm (`{ mode: 'a' }` vs `{ mode: 'dev' }`). `value` is a FLAT property map,
 *   each entry a representative scalar drawn from the merged stub view (a human correction or the
 *   derived demand) — an INPUT, never a code-derived output (P4). v1 arranges scalar-valued properties
 *   only; nested objects/arrays are a later phase.
 *
 *   `salient` marks whether the case belongs to the intelligent (must-run) subset. It defaults to
 *   true so a cache blob written before the field existed reads back as all-salient.
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
 * derivedTestCaseContract.parse({
 *   reachesExit: 'decide/return@else',
 *   arrange: [{ kind: 'object', param: 'config', value: { mode: 'dev' } }],
 * });
 * // Returns a validated DerivedTestCase (branded fields; salient defaults to true)
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
      z.object({
        kind: z.literal('object'),
        param: symbolNameContract,
        value: z.record(symbolNameContract, representativeValueContract),
      }),
    ]),
  ),
  salient: z.boolean().default(true),
});

export type DerivedTestCase = z.infer<typeof derivedTestCaseContract>;
