/**
 * PURPOSE: Branded contract for the console output of a run — the text the assayer CLI wrote while
 *   executing one file's derived cases, verbatim.
 *
 *   It lives in shared because four packages hold the same bytes in turn: the CLI writes them beside
 *   the run artifact, core saves and finds them, the desktop carries them over IPC, and the renderer
 *   shows them. A per-package copy of this type would be four spellings of one concept, and the whole
 *   point of the artifact is that a human's terminal and the panel cannot disagree about what a run
 *   said.
 *
 *   Empty is a valid value, not a missing one: a run that has started but written nothing yet has an
 *   empty console, and the panel showing it is the evidence the run is under way. "No console at all"
 *   is `undefined` — a file nobody has run — and the two must not collapse.
 *
 * USAGE:
 * runConsoleContract.parse('packages/a.ts  3/3 passed');
 * // Returns a branded RunConsole
 */
import { z } from 'zod';

export const runConsoleContract = z.string().brand<'RunConsole'>();

export type RunConsole = z.infer<typeof runConsoleContract>;
