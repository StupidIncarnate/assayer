/**
 * PURPOSE: Contract for a derived test case — one structurally-asserting case Assayer would generate:
 *   the arrange bindings that set the inputs up, and the ordered PATH of exits the flow must then
 *   reach. Every value is drawn from an input domain, never from executing the code (P4).
 *
 *   `arrange` is an array of `ArrangeBinding` — how each input is set up (a positional param, an env
 *   key, an object's property map, an array's list). The binding union and its per-kind rules live in
 *   the `arrange-binding` contract.
 *
 *   `reachesPath` is the ordered list of exit coverage IDs the flow fires, innermost first. A flat case
 *   reaches exactly one exit, so its path is a single element. A case that FUNNELS through a nested
 *   scope reaches that scope's exit first and then returns through the surface's own exit, so its path
 *   is `[innerExit, surfaceExit]`. Asserting the whole ordered path — not just a terminal exit — is what
 *   lets an empty array (the callback never runs, path is just the surface's exit) be told apart from a
 *   single-element one (the callback's exit, then the surface's). The first element is the case's
 *   DISTINGUISHING exit, the one a surface renders it by.
 *
 *   `salient` marks whether the case belongs to the intelligent (must-run) subset. It defaults to
 *   true so a cache blob written before the field existed reads back as all-salient.
 *
 * USAGE:
 * derivedTestCaseContract.parse({
 *   reachesPath: ['formatGreeting/return@if-then'],
 *   arrange: [{ kind: 'param', param: 'name', value: '' }],
 * });
 * derivedTestCaseContract.parse({
 *   reachesPath: ['rescale/cb/return@then', 'rescale/return@top'],
 *   arrange: [{ kind: 'array', param: 'items', value: [101] }],
 * });
 * // Returns a validated DerivedTestCase (branded fields; salient defaults to true)
 */
import { z } from '#gateway/npm/zod';

import { arrangeBindingContract } from '../arrange-binding/arrange-binding-contract';
import { coverageContract } from '../coverage/coverage-contract';

export const derivedTestCaseContract = z.object({
  reachesPath: z.array(coverageContract.shape.id).min(1),
  arrange: z.array(arrangeBindingContract),
  salient: z.boolean().default(true),
});

export type DerivedTestCase = z.infer<typeof derivedTestCaseContract>;
