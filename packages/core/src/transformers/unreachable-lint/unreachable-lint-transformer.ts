/**
 * PURPOSE: Builds the `unreachable-exit` lint entries for one entry's dead exits — the product-surface
 *   message (P1) explaining WHY each exit can never run, worded for an LLM to act on.
 *
 *   The reason splits two ways, because two different things make an exit unreachable and telling the
 *   reader the wrong one wastes their time:
 *   - CONTRADICTORY guards — the exit sits behind guards that cannot all hold at once (`>= 1` then
 *     `<= 1`), so no value satisfies them. The message names the guard lines.
 *   - a WELDED constant — the exit's branch turns on a value fixed in the source (`const level = 7`),
 *     so that branch always takes its other arm and this one is dead. The message names the operand and
 *     its welded value (or fixed length), never "the guards cannot all hold at once", which is false
 *     when there is a single always-true guard.
 *
 *   `name` keys the lint to its entry (a module scope stays `*module*`); `displayName` is what the
 *   message shows — a module's label, an anonymous scope's callsite, or a named function's own name —
 *   so the reader never meets a cache key, neither the internal `*module*` token nor an anonymous
 *   scope's structural projection.
 *
 * USAGE:
 * unreachableLintTransformer({ name: 'classify', displayName: 'classify', unreachableExits: [{ line: 10, guardLines: [2, 6] }] });
 * // Returns [{ rule: 'unreachable-exit', name: 'classify', message: '…', startLine: 10, endLine: 10 }]
 */
import { lintEntryContract } from '@assayer/shared/contracts';
import type { LintEntry, RepresentativeValue } from '@assayer/shared/contracts';

export const unreachableLintTransformer = ({
  name,
  displayName,
  unreachableExits,
}: {
  name: string;
  displayName: string;
  unreachableExits: {
    line: number;
    guardLines: number[];
    welded?: { line: number; operand?: string; value?: RepresentativeValue; length?: number };
  }[];
}): LintEntry[] =>
  unreachableExits.map((unreachable) => {
    const subject = unreachable.welded?.operand === undefined ? 'the value it branches on' : `\`${unreachable.welded.operand}\``;
    const weldedTo =
      unreachable.welded?.length === undefined
        ? `welded to \`${JSON.stringify(unreachable.welded?.value)}\``
        : `welded to a fixed length of ${String(unreachable.welded.length)}`;

    const message =
      unreachable.welded === undefined
        ? `\`${displayName}\` can never reach the exit on line ${String(unreachable.line)}: the guards on ${unreachable.guardLines.length === 1 ? 'line' : 'lines'} ${unreachable.guardLines.map((line) => String(line)).join(', ')} cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.`
        : `\`${displayName}\` can never reach the exit on line ${String(unreachable.line)}: ${subject} is ${weldedTo}, so the branch on line ${String(unreachable.welded.line)} always takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.`;

    return lintEntryContract.parse({
      rule: 'unreachable-exit',
      name,
      message,
      startLine: unreachable.line,
      endLine: unreachable.line,
    });
  });
