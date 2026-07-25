/**
 * PURPOSE: Formats run results into the text `assayer unit` prints — product surface, written for an
 *   LLM to act on without a human.
 *
 *   A failure names the ARRANGE that drove it, the exit derivation PREDICTED, and what actually
 *   happened, because "L3 != L6" is unreadable on its own: the reader needs the values and the
 *   claim, not two line numbers. Each failing file ends with the one command that shows its whole
 *   trace — a review backstop nobody can reach in one step stops being used.
 *
 *   FAIL and ERROR are different markers because they send the reader to different places. FAIL means
 *   the case ran and came out the wrong exit, so the derivation is what to look at. ERROR means no
 *   verdict was produced — the entry threw, was not callable, or reached no exit — so the ARRANGE is
 *   what to look at, and an ERROR line therefore leads with its message rather than a predicted-versus-
 *   observed pair it does not have. Both count against the header's passed tally: neither passed.
 *
 *   Gaps print even when every case passed. A gap is Assayer saying what it could NOT drive; a run
 *   that reports only its passes reads as complete coverage of the file, which is the exact lie
 *   `darkSpots` exists to prevent.
 *
 *   Dark spots print on their own line, worded to name ASSAYER as the one who owes the work. A GAP is
 *   the reader's to close — build an instance, write a harness. A dark spot is syntax Assayer has no
 *   handler for, so telling the reader to fix their own for-loop would be advice they cannot act on,
 *   and unactionable text is the one thing this report may never be.
 *
 *   Every admission row is spelled `<MARKER> <subject> — <text>` with ONE space after the marker, and
 *   the desktop panel spells each the same way. Two surfaces over one artifact that word it differently
 *   are two artifacts to the reader, so the shape is uniform rather than aligned per marker.
 *
 *   UNDRIVEN prints on a third line for the same reason, and never as one of the other two. It is
 *   logic Assayer read perfectly and cannot yet call — a module scope, a private helper — so filing
 *   it as a gap would order a harness nobody can write, and filing it as a dark spot would blame a
 *   parser that saw the code fine. Without this line, `0/0 passed` is all a file of pure module-scope
 *   branching ever says, which is what a file with nothing in it says too.
 *
 * USAGE:
 * unitReportFormatTransformer({ runs: [RunResultStub()] });
 * // Returns the full report text
 */
import { arrangeTextTransformer } from '@assayer/shared/transformers';

import { cliOutputContract } from '../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../contracts/cli-output/cli-output-contract';
import type { RunResult } from '@assayer/shared/contracts';

export const unitReportFormatTransformer = ({ runs }: { runs: readonly RunResult[] }): CliOutput => {
  const lines = runs.flatMap((run) => {
    // Everything that did not pass, in case order — an ERROR and a FAIL are equally unresolved, and
    // interleaving them by outcome would scramble the order the cases were derived in.
    const unresolved = run.cases.filter((testCase) => String(testCase.status) !== 'passed');
    const header = `${String(run.relPath)}  ${run.cases.length - unresolved.length}/${run.cases.length} passed`;

    const failed = unresolved.map((testCase) => {
      const args = arrangeTextTransformer({ arrange: testCase.testCase.arrange });

      // An errored case never reached an exit, so it has no predicted-versus-observed pair to show;
      // printing one would invite a comparison against a run that produced no observation at all. Its
      // message IS the finding, and it names the arrange the reader has to fix.
      return String(testCase.status) === 'errored'
        ? [`  ERROR ${String(testCase.entryName)}(${args})`, `    ${String(testCase.message ?? 'no verdict was produced')}`].join('\n')
        : [
            `  FAIL ${String(testCase.entryName)}(${args})`,
            `    predicted ${testCase.testCase.reachesPath.map(String).join(' → ')}`,
            `    reached ${testCase.observedPath.map(String).join(' → ')}`,
          ].join('\n');
    });

    const gaps = run.gaps.map((gap) => `  GAP ${String(gap.name)} — ${String(gap.reason)}`);
    const darkSpots = run.darkSpots.map(
      (darkSpot) =>
        `  DARK ${String(darkSpot.kind)} at L${String(darkSpot.startLine)}-L${String(darkSpot.endLine)} in ` +
        `${darkSpot.scopePath.map((segment) => String(segment)).join('/')} — Assayer has no handler for it, so ` +
        'nothing inside it is covered',
    );
    const undriven = run.undriven.map(
      (entry) => `  UNDRIVEN ${String(entry.label ?? entry.name)} — ${String(entry.reason)}`,
    );
    // A fourth line, worded to name the REPO as the one who owes the change: a lint is a pattern to
    // remove, not an admission Assayer owes. Unlike the three above, it can fail the build.
    const lints = run.lints.map((lint) => `  LINT ${String(lint.name)} — ${String(lint.message)}`);
    const link = unresolved.length === 0 ? [] : [`  assayer detail ${String(run.runId)}`];

    return [header, ...failed, ...gaps, ...darkSpots, ...undriven, ...lints, ...link];
  });

  return cliOutputContract.parse(lines.join('\n'));
};
