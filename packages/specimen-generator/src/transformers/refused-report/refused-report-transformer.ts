/**
 * PURPOSE: Writes the text of `REFUSED.md`, the list of specimens the generator dropped because
 * TypeScript rejected them. Reach for this when the refused list becomes a file.
 *
 * USAGE:
 * refusedReportTransformer({ refused });
 * // Returns the markdown text, one line per refused folder in folder order, ending in a newline
 */
import type { RefusedSpecimen } from '../../contracts/refused-specimen/refused-specimen-contract';

export const refusedReportTransformer = ({ refused }: { refused: readonly RefusedSpecimen[] }): string => {
  const lines = [...refused]
    .sort((left, right) => {
      if (left.folder < right.folder) {
        return -1;
      }
      return left.folder > right.folder ? 1 : 0;
    })
    .map(({ folder, reason }) => `- \`${folder}\`: ${reason}`);

  return [
    '# Specimens TypeScript refused',
    '',
    "The generator does not write a specimen that TypeScript rejects, and lists it here with TypeScript's reason.",
    '',
    ...(lines.length === 0 ? ['None.'] : lines),
    '',
  ].join('\n');
};
