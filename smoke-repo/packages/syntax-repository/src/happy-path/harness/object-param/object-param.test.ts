import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { harnessRealizeBroker } from '@assayer/core/harness-realize';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'object-param.ts'), 'utf8');
const relPath = 'src/happy-path/harness/object-param/object-param.ts';
const root = join(__dirname, '..', '..', '..', '..');

const THEN = '*module*/emit/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#then';
const ELSE = '*module*/emit/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#else';

describe('harness / object-param — a harness supplies a whole SHAPE, not merely a callable', () => {
  // Byte for byte the source under `sad-path/input-gap/object-param`. The walk reads `Sink` completely —
  // the interface is declared right here — and refuses it anyway, because an object is fillable only
  // when EVERY property is and `write` is a function. So the refusal is precise, and what the harness
  // answers is the whole parameter rather than one member of it.
  it('VALID: {the per-file analysis alone} => the shape is read in full and the parameter still refused', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      declaredTypes: analysis.declaredTypes,
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps.map((gap) => String(gap.name)),
    }).toStrictEqual({
      declaredTypes: [
        { name: 'Sink', properties: [{ name: 'write', type: { kind: 'callable', text: '(line: string) => string' } }] },
      ],
      cases: [],
      gaps: ['emit'],
    });
  });

  // One binding for the whole object. The harness key names the PARAMETER (`inputs.emit.sink`), never a
  // property inside it — a shape Assayer refuses is refused entire, so what the caller owes is the whole
  // value and the case says so in one line.
  it('VALID: {the colocated harness applied} => both arms derive, the whole shape bound to one key path', () => {
    const walked = walkFileTransformer({ source, relPath });
    const analysis = harnessRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), root, relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      {
        reachesPath: [THEN],
        arrange: [
          { kind: 'param', param: 'size', value: 11 },
          { kind: 'harness', param: 'sink', key: 'inputs.emit.sink' },
        ],
        salient: true,
      },
      {
        reachesPath: [ELSE],
        arrange: [
          { kind: 'param', param: 'size', value: 10 },
          { kind: 'harness', param: 'sink', key: 'inputs.emit.sink' },
        ],
        salient: true,
      },
    ]);
  });

  it('VALID: {the colocated harness applied} => the gap comes off the channel and no other admission replaces it', () => {
    const walked = walkFileTransformer({ source, relPath });
    const analysis = harnessRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), root, relPath });

    expect({
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({ gaps: [], undriven: [], darkSpots: [], lints: [] });
  });
});
