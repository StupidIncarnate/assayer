import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { paramTypeResolveBroker } from '@assayer/core/param-type-resolve';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'generic-alias.ts'), 'utf8');
const relPath = 'src/happy-path/object/generic-alias/generic-alias.ts';
const root = resolve(__dirname, '..', '..', '..', '..');

describe('object / generic-alias — generic-alias.ts, a reader of an imported GENERIC alias', () => {
  // `Box<T>` denotes nothing constructible on its own; only `Box<string>` says what `T` is. The
  // reference's type ARGUMENTS travel with it to the declaration one file over and fill the type
  // parameters by position, so the reader gets `{ value: string }` and derives its case. Resolved
  // without them, `value` stays the opaque placeholder `T` and the reader is invoiced for a shape the
  // sibling describes in full.
  it('VALID: {box: Box<string> imported from ./box} => the parameter typed as the instantiated shape', () => {
    const walked = walkFileTransformer({ source, relPath });
    const analysis = paramTypeResolveBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath });

    expect(analysis.functions.flatMap((fn) => fn.entry.params)).toStrictEqual([
      {
        name: 'box',
        // The SOURCE's spelling, which the resolved descriptor's name (`Box`) drops.
        declaredText: 'Box<string>',
        type: { kind: 'object', typeName: 'Box', properties: [{ name: 'value', type: { kind: 'string' } }] },
      },
    ]);
  });

  it('VALID: {an instantiated generic parameter} => one case built from it, and nothing invoiced', () => {
    const walked = walkFileTransformer({ source, relPath });
    const analysis = paramTypeResolveBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({
      cases: [
        {
          reachesPath: ['*module*/openBox/return@top'],
          arrange: [{ kind: 'object', param: 'box', value: { value: 'abc123' } }],
          salient: true,
        },
      ],
      gaps: [],
      undriven: [],
      lints: [],
    });
  });
});
