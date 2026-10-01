/**
 * PURPOSE: Formats one saved run into the text `assayer detail <runId>` prints — the whole trace,
 *   per case: what drove it, which leaf decided, and where it came out.
 *
 *   It renders the TRACE rather than a bespoke explanation. The probes are one observation layer with
 *   two consumers — the interpreter's verdict and this — so what a human reads here cannot drift from
 *   what the test actually verified.
 *
 *   A leaf that never fired is simply ABSENT: it has no event, because the language never evaluated
 *   it. That is not the same as false, and the difference is the capability branch coverage throws
 *   away — so nothing here invents a line for it.
 *
 *   All four admissions — gaps, dark spots, undriven entries, lints — print after the trace, in the
 *   SAME order and the SAME `<MARKER> <subject> — <text>` shape `assayer unit` and the desktop panel
 *   use. `assayer detail` is "one saved run in full", so leaving three of the four silent here would
 *   make the detail view say LESS about the file than the summary it links from — the opposite of what
 *   a detail view is for.
 *
 * USAGE:
 * runDetailFormatTransformer({ run: RunResultStub() });
 * // Returns the full per-case trace text
 */
import { arrangeTextTransformer } from '@assayer/shared/transformers';

import type { RunResult } from '@assayer/shared/contracts';
import { darkSpotLineFormatTransformer } from '../dark-spot-line-format/dark-spot-line-format-transformer';
import { gapLineFormatTransformer } from '../gap-line-format/gap-line-format-transformer';
import { lintLineFormatTransformer } from '../lint-line-format/lint-line-format-transformer';
import { undrivenLineFormatTransformer } from '../undriven-line-format/undriven-line-format-transformer';

export const runDetailFormatTransformer = ({ run }: { run: RunResult }): string => {
  const header = `${String(run.relPath)}  run ${String(run.runId)}`;

  const cases = run.cases.flatMap((testCase) => {
    const args = arrangeTextTransformer({ arrange: testCase.testCase.arrange });
    const events = testCase.trace.map((event) => {
      const outcome = event.outcome === undefined ? '' : ` ${String(event.outcome)}`;

      return `    ${String(event.kind)}  ${String(event.id)}${outcome}  ${String(event.valueText)}`;
    });

    // `errored` renders as ERROR rather than its own spelling: the marker is product surface shared
    // with `assayer unit`, and two spellings of one outcome is two vocabularies for the reader to
    // learn. PASS/FAIL are already their own uppercase.
    const marker = String(testCase.status) === 'errored' ? 'ERROR' : String(testCase.status).toUpperCase();

    return [
      `  ${marker} ${String(testCase.entryName)}(${args})`,
      `    predicted ${testCase.testCase.reachesPath.map(String).join(' → ')}`,
      ...events,
    ];
  });

  // The same four line-format transformers `assayer unit` uses, in the same order: gaps, dark spots,
  // undriven entries, lints. One space after the marker, exactly as the desktop panel spells it — the
  // two surfaces over one artifact must never word one admission two ways.
  const gaps = run.gaps.map((gap) => gapLineFormatTransformer({ gap }));
  const darkSpots = run.darkSpots.map((darkSpot) => darkSpotLineFormatTransformer({ darkSpot }));
  const undriven = run.undriven.map((entry) => undrivenLineFormatTransformer({ entry }));
  const lints = run.lints.map((lint) => lintLineFormatTransformer({ lint }));

  return [header, ...cases, ...gaps, ...darkSpots, ...undriven, ...lints].join('\n');
};
