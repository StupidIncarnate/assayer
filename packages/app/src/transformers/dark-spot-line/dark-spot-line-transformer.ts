/**
 * PURPOSE: Renders one dark spot as the sentence the UI shows for it — the syntax KIND Assayer choked
 *   on, the line span it covers, the scope path it sits in, and what that costs the reader. Drives
 *   both the detail panel's dark-spot row and the code viewer's gutter-icon tooltip.
 *
 *   The wording matches `assayer unit`'s DARK line (see the CLI's unit-report-format-transformer),
 *   because the report and the window read one artifact and must describe it identically — a reader
 *   who sees two wordings for one dark spot has to work out which surface is lying.
 *
 *   It names ASSAYER as the one who owes the work, and that is the whole point of the phrasing. A GAP
 *   is the reader's to close — build an instance, write a harness — so its text asks for one. Nothing
 *   the reader writes can close a dark spot, so text telling them to fix their own for-loop would be
 *   advice they cannot act on. It states the consequence instead: nothing inside the region is
 *   covered.
 *
 * USAGE:
 * darkSpotLineTransformer({ darkSpot });
 * // Returns 'DARK ForOfStatement at L4-L6 in sumAll — Assayer has no handler for it, so nothing inside it is covered'
 * // (a scope path joins its segments with slashes; one cannot be written here, since it would close this comment)
 */
import type { DarkSpot } from '@assayer/shared/contracts';

import { darkSpotLineContract } from '../../contracts/dark-spot-line/dark-spot-line-contract';
import type { DarkSpotLine } from '../../contracts/dark-spot-line/dark-spot-line-contract';

export const darkSpotLineTransformer = ({ darkSpot }: { darkSpot: DarkSpot }): DarkSpotLine => {
  const scope = darkSpot.scopePath.map((segment) => String(segment)).join('/');

  return darkSpotLineContract.parse(
    `DARK ${String(darkSpot.kind)} at L${String(darkSpot.startLine)}-L${String(darkSpot.endLine)} in ` +
      `${scope} — Assayer has no handler for it, so nothing inside it is covered`,
  );
};
