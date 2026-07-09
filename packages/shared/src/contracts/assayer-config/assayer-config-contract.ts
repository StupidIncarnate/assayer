/**
 * PURPOSE: Contract for the assayer repo-level configuration file — the schema version
 *   literal, the repo root, glob exclusions, and the optional stable-branch override used
 *   for ref-to-ref diffing. Defaults apply when a field is omitted.
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
});

export type AssayerConfig = z.infer<typeof assayerConfigContract>;
