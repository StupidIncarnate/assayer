/**
 * PURPOSE: Branded contract for a dark spot's rendered line — the one sentence both UI surfaces show
 *   about a region Assayer could not follow: the detail panel's row and the code viewer's icon
 *   tooltip.
 *
 *   One contract for both because they are one sentence. A panel and a gutter that describe the same
 *   dark spot in different words are two facts to the reader, and the reader cannot tell which is the
 *   real one.
 *
 * USAGE:
 * darkSpotLineContract.parse('DARK ForOfStatement at L4-L6 in sumAll — Assayer has no handler for it, so nothing inside it is covered');
 * // Returns a branded DarkSpotLine
 */
import { z } from 'zod';

export const darkSpotLineContract = z.string().min(1).brand<'DarkSpotLine'>();

export type DarkSpotLine = z.infer<typeof darkSpotLineContract>;
