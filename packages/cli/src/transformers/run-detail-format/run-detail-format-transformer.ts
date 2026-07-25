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
 * USAGE:
 * runDetailFormatTransformer({ run: RunResultStub() });
 * // Returns the full per-case trace text
 */
import { arrangeTextTransformer } from '@assayer/shared/transformers';

import { cliOutputContract } from '../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../contracts/cli-output/cli-output-contract';
import type { RunResult } from '@assayer/shared/contracts';

export const runDetailFormatTransformer = ({ run }: { run: RunResult }): CliOutput => {
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

  // One space after the marker, exactly as DARK / UNDRIVEN / LINT and the desktop panel spell it: every
  // admission row is `<MARKER> <subject> — <text>`, so the two surfaces over one artifact read alike.
  const gaps = run.gaps.map((gap) => `  GAP ${String(gap.name)} — ${String(gap.reason)}`);

  return cliOutputContract.parse([header, ...cases, ...gaps].join('\n'));
};
