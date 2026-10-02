import { ScriptTarget } from '#gateway/npm/ts-morph';

import { analysisProjectionTransformer } from '../../../transformers/analysis-projection/analysis-projection-transformer';
import { fileWalkBroker } from './file-walk-broker';
import { fileWalkBrokerProxy } from './file-walk-broker.proxy';

const LAST_ELEMENT = 'export const last = (xs: number[]) => xs.at(-1);\n';

describe('fileWalkBroker', () => {
  it('VALID: {a file its tsconfig gives the ES2022 library} => reads Array.prototype.at, so the return is number or undefined', () => {
    const proxy = fileWalkBrokerProxy();
    proxy.filesOwnedBy({
      absPaths: ['/repo/src/last.ts'],
      configFilePath: '/repo/tsconfig.json',
      options: { target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'], outDir: '/repo/dist' },
    });

    const walked = fileWalkBroker({ source: LAST_ELEMENT, relPath: 'src/last.ts', absPath: '/repo/src/last.ts' });

    expect(analysisProjectionTransformer({ walked })).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'last',
            scopePath: ['*module*', 'last'],
            params: [{ name: 'xs', type: { kind: 'array', element: { kind: 'number' } } }],
            returnType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
            line: 1,
            access: { kind: 'named' },
          },
          branches: [],
          exits: [{ coverageId: '*module*/last/return@top', kind: 'return', guardPath: [], line: 1 }],
        },
      ],
    });
  });

  it('EMPTY: {a file no tsconfig owns} => reads TypeScript defaults, where ES5 has no Array.prototype.at', () => {
    const proxy = fileWalkBrokerProxy();
    proxy.filesWithoutOwner({ absPaths: ['/loose/last.ts'] });

    const walked = fileWalkBroker({ source: LAST_ELEMENT, relPath: 'last.ts', absPath: '/loose/last.ts' });

    expect(analysisProjectionTransformer({ walked })).toStrictEqual({
      success: true,
      functions: [
        {
          entry: {
            name: 'last',
            scopePath: ['*module*', 'last'],
            params: [{ name: 'xs', type: { kind: 'array', element: { kind: 'number' } } }],
            returnType: { kind: 'unknown', text: 'any' },
            line: 1,
            access: { kind: 'named' },
          },
          branches: [],
          exits: [{ coverageId: '*module*/last/return@top', kind: 'return', guardPath: [], line: 1 }],
        },
      ],
    });
  });
});
