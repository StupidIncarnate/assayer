/**
 * PURPOSE: Formats one dark spot as the row `assayer unit` and `assayer detail` print for it — the
 *   ONE place that builds this text, so the two commands can never spell one dark spot two ways. Named
 *   ASSAYER as the one who owes the work: a dark spot is syntax it never understood, so telling the
 *   reader to fix their own for-loop would be advice they cannot act on.
 *
 * USAGE:
 * darkSpotLineFormatTransformer({ darkSpot: DarkSpotStub() });
 * // Returns '  DARK ForStatement at L3-L5 in sumAll — Assayer has no handler for it, so nothing inside it is covered'
 */
import type { DarkSpot } from '@assayer/shared/contracts';


export const darkSpotLineFormatTransformer = ({ darkSpot }: { darkSpot: DarkSpot }): string =>
  (`  DARK ${String(darkSpot.kind)} at L${String(darkSpot.startLine)}-L${String(darkSpot.endLine)} in ` +
      `${darkSpot.scopePath.map((segment) => String(segment)).join('/')} — Assayer has no handler for it, so ` +
      'nothing inside it is covered');
