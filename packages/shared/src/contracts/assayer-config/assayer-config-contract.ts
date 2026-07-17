/**
 * PURPOSE: Contract for the assayer repo-level configuration file — the schema version
 *   literal, the repo root, glob exclusions, the optional stable-branch override used
 *   for ref-to-ref diffing, and how loudly unhandled syntax is reported. Defaults apply
 *   when a field is omitted.
 *
 *   `darkSpots` defaults to `warn` because a dark spot is ASSAYER's debt, not the repo's: it means
 *   the analyzer has no handler for some syntax, and failing a build over work only Assayer can do
 *   would punish the wrong party. It becomes `error` once the handler set covers the main
 *   constructs — at which point a dark spot means something genuinely strange, and a one-line change
 *   to this default flips every repo at once.
 *
 *   Repo-wide, and deliberately with no per-file or per-line escape. A suppression that can be
 *   applied at the site of the problem is how "we do not care here" quietly becomes "we do not care
 *   anywhere", one file at a time, with nobody able to see the total. If unfollowed syntax is
 *   acceptable, it is acceptable repo-wide and visible in one place.
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
});

export type AssayerConfig = z.infer<typeof assayerConfigContract>;
