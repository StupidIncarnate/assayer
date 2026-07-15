/**
 * PURPOSE: Contract for a generated shim's source — the trivial file Jest discovers so it has
 *   something to run. Cache-resident, never committed, never edited by hand.
 *
 * USAGE:
 * shimSourceContract.parse("const caseSet = require('./x.cases.json');");
 * // Returns a validated ShimSource (branded)
 */
import { z } from 'zod';

export const shimSourceContract = z.string().min(1).brand<'ShimSource'>();

export type ShimSource = z.infer<typeof shimSourceContract>;
