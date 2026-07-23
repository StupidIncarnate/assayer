/**
 * PURPOSE: Contract for the assayer repo-level configuration file — the schema version
 *   literal, the repo root, glob exclusions, the optional stable-branch override used
 *   for ref-to-ref diffing, how loudly unhandled syntax is reported, and `runMode`.
 *   Defaults apply when a field is omitted.
 *
 *   `runMode` is DISPLAY-ONLY: `thorough` (the default) shows every derived case live; `intelligent`
 *   grays the non-salient breadth so a reviewer reads only the execution subset. It changes nothing
 *   that runs — the run engine always executes the full set — and is deliberately absent from
 *   `configHashBroker`, so flipping it never invalidates a content-keyed cache blob.
 *
 *   `darkSpots` defaults to `warn` because a dark spot is ASSAYER's debt, not the repo's: it means
 *   the analyzer has no handler for some syntax, and failing a build over work only Assayer can do
 *   would punish the wrong party. It becomes `error` once the handler set covers the main
 *   constructs — at which point a dark spot means something genuinely strange, and a one-line change
 *   to this default flips every repo at once.
 *
 *   `deadSurface` defaults to `error`, and the difference from `darkSpots` is WHO owes the work: a
 *   dead-surface lint is the REPO's debt — an unexported helper nothing consumes is dead code nothing
 *   outside the module can ever reach — so failing the build punishes the party that can fix it. `off`
 *   and `warn` exist for repos mid-cleanup; `error` is the honest default.
 *
 *   Repo-wide, and deliberately with no per-file or per-line escape. A suppression that can be
 *   applied at the site of the problem is how "we do not care here" quietly becomes "we do not care
 *   anywhere", one file at a time, with nobody able to see the total. If unfollowed syntax or dead
 *   surface is acceptable, it is acceptable repo-wide and visible in one place.
 *
 * USAGE:
 * const config = assayerConfigContract.parse({});
 * // Returns a validated AssayerConfig with defaults applied (branded fields)
 */
import { z } from 'zod';

export const assayerConfigContract = z.object({
  version: z.literal('1').default('1').brand<'ConfigSchemaVersion'>(),
  repoRoot: z.string().min(1).default('.').brand<'RepoRootPath'>(),
  exclude: z.array(z.string().min(1).brand<'GlobPattern'>()).default([]).brand<'GlobPatternList'>(),
  stableBranch: z.string().min(1).brand<'StableBranchName'>().optional(),
  darkSpots: z.enum(['warn', 'error']).default('warn').brand<'DarkSpotSeverity'>(),
  deadSurface: z.enum(['off', 'warn', 'error']).default('error').brand<'DeadSurfaceSeverity'>(),
  runMode: z.enum(['thorough', 'intelligent']).default('thorough').brand<'RunMode'>(),
});

export type AssayerConfig = z.infer<typeof assayerConfigContract>;
