import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { harnessRealizeBroker } from '@assayer/core/harness-realize';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'callback-param.ts'), 'utf8');
const relPath = 'src/happy-path/harness/callback-param/callback-param.ts';
// The package root, which is what `root` means to every consume-time overlay: the harness is found at
// `<root>/<relPath with .harness.ts>`, so the two have to be halves of one real path.
const root = join(__dirname, '..', '..', '..', '..');

const THEN = '*module*/audit/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#then';
const ELSE = '*module*/audit/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#else';

describe('harness / callback-param — a colocated harness PAYS the callback gap, and both arms run', () => {
  // Byte for byte the source under `sad-path/input-gap/callback-param`, and its per-file analysis says
  // exactly what that one's does: `report` is a callable, no value in the arrange vocabulary is a
  // function, so the seam refuses it and the entry derives nothing. The harness is the ONLY difference
  // between the two specimens, which is what makes the pair a controlled experiment rather than two
  // files that happen to disagree.
  it('VALID: {the per-file analysis alone} => the same refusal its unharnessed twin has', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps.map((gap) => String(gap.name)),
    }).toStrictEqual({ cases: [], gaps: ['audit'] });
  });

  // The payoff. The overlay finds `callback-param.harness.ts` beside this file by basename plus the
  // symbol gate, runs it, and re-derives `audit` through the SAME case engine with `report` bound to its
  // key path — so each case differs from an ordinary derived one in exactly that one binding. The VALUE
  // never rides in the case: `inputs.audit.report` is what the run resolves against the same file.
  it('VALID: {the colocated harness applied} => both arms derive, the callback bound to its key path', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
    const analysis = harnessRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), root, relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      {
        reachesPath: [THEN],
        arrange: [
          { kind: 'param', param: 'size', value: 11 },
          { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
        ],
        salient: true,
      },
      {
        reachesPath: [ELSE],
        arrange: [
          { kind: 'param', param: 'size', value: 10 },
          { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
        ],
        salient: true,
      },
    ]);
  });

  // The invoice is PAID, not reprinted — and nothing else takes its place. A gap that survived the value
  // that answers it would bill the reader for work they have already done, and an admission arriving on
  // another channel would do the same thing under a different name.
  it('VALID: {the colocated harness applied} => the gap comes off the channel and no other admission replaces it', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
    const analysis = harnessRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), root, relPath });

    expect({
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({ gaps: [], undriven: [], darkSpots: [], lints: [] });
  });
});
