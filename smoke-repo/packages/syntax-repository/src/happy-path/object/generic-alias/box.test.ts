import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'box.ts'), 'utf8');
const relPath = 'src/happy-path/object/generic-alias/box.ts';

describe('object / generic-alias — box.ts, the DEFINITION file declaring the generic alias', () => {
  // The declaration carries its type PARAMETER names, which are the slots a reference's arguments fill.
  // `rewrap` is here to give the file a runnable entry, and it exercises the SAME-FILE half: the
  // checker instantiates `Box<number>` itself, so the parameter is already the enumerated shape.
  it('VALID: {type Box<T> + rewrap(box: Box<number>)} => the parameter typed as the instantiated shape, one case', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'box.ts') }), relPath });

    expect({
      params: analysis.functions.flatMap((fn) => fn.entry.params),
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({
      params: [
        {
          name: 'box',
          // The checker qualifies a resolvable generic by MODULE PATH, which is no name a reader can
          // find in their file, so the reference renders as its own name plus its arguments.
          declaredText: 'Box<number>',
          type: { kind: 'object', typeName: 'Box', properties: [{ name: 'value', type: { kind: 'number' } }] },
        },
      ],
      cases: [
        {
          reachesPath: ['*module*/rewrap/return@top'],
          arrange: [{ kind: 'object', param: 'box', value: { value: 7 } }],
          salient: true,
        },
      ],
      gaps: [],
      undriven: [],
      lints: [],
    });
  });
});
