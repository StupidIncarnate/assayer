/**
 * PURPOSE: Builds one manifest row for a planned specimen. It takes the plan's plain fields, and the
 * `uses` and `provenances` that fillTreeUsesTransformer and fillTreeLeavesTransformer read off the plan's tree, so it needs no
 * TypeScript nodes. The verdict comes from specimenVerdictTransformer, the same rule the
 * prediction uses.
 *
 * USAGE:
 * manifestEntryTransformer({ folder, relPath, focusName: 'if', containerName: 'class', slotName: 'body', path: ['cond', 'value'], provenance: 'param', uses: ['if', 'gt'], provenances: ['param', 'literal'] });
 * // Returns a ManifestEntry with path 'cond › value' and verdict 'driven'
 */
import type { ManifestEntry } from '../../contracts/manifest-entry/manifest-entry-contract';
import { manifestEntryContract } from '../../contracts/manifest-entry/manifest-entry-contract';
import { specimenVerdictTransformer } from '../specimen-verdict/specimen-verdict-transformer';

export const manifestEntryTransformer = ({
  folder,
  relPath,
  focusName,
  containerName,
  slotName,
  path,
  provenance,
  uses,
  provenances,
}: {
  folder: string;
  relPath: string;
  focusName: string;
  containerName: string;
  slotName: string;
  path: readonly string[];
  provenance: ManifestEntry['provenance'];
  uses: readonly string[];
  provenances: readonly ManifestEntry['provenance'][];
}): ManifestEntry =>
  manifestEntryContract.parse({
    folder,
    relPath,
    focus: focusName,
    container: containerName,
    slot: slotName,
    path: path.join(' › '),
    provenance,
    uses,
    verdict: specimenVerdictTransformer({ provenances }),
  });
