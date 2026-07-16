/**
 * PURPOSE: Branded contract for the console output of a run — the text the assayer CLI wrote while
 *   executing one file's derived cases, verbatim.
 *
 *   Empty is a valid value, not a missing one: a run that has started but written nothing yet has an
 *   empty console, and the panel showing it is the evidence the run is under way.
 *
 * USAGE:
 * runConsoleContract.parse('packages/a.ts  3/3 passed');
 * // Returns a branded RunConsole
 */
import { z } from 'zod';

export const runConsoleContract = z.string().brand<'RunConsole'>();

export type RunConsole = z.infer<typeof runConsoleContract>;
