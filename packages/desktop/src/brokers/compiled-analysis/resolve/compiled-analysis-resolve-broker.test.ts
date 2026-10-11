import { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';
import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';

import { compiledAnalysisResolveBroker } from './compiled-analysis-resolve-broker';
import { compiledAnalysisResolveBrokerProxy } from './compiled-analysis-resolve-broker.proxy';

// A caller whose parameter is declared as an IMPORTED type. The persisted analysis refuses that
// parameter and carries a gap. The sibling file on disk declares the type, so the overlays build the
// parameter and the gap closes.
const READER_SOURCE =
  "import type { Config } from './types';\n\nexport function readMode(config: Config): string {\n  return config.mode;\n}\n";
const TYPES_SOURCE = 'export interface Config {\n  mode: string;\n  region: string;\n}\n';
const READER_ANALYSIS = FileAnalysisStub({
  functions: [
    {
      entry: {
        name: 'readMode',
        scopePath: ['*module*', 'readMode'],
        params: [{ name: 'config', type: { kind: 'unknown', text: 'Config', typeRef: 'Config' } }],
        returnType: { kind: 'string' },
        line: 3,
        access: { kind: 'named' },
      },
      branches: [],
      exits: [{ coverageId: '*module*/readMode/return@top', kind: 'return', guardPath: [], line: 4 }],
      cases: [],
    },
  ],
  enrichment: [{ line: 3, symbol: 'config', typeText: 'Config' }],
  gaps: [{ name: 'readMode', reason: '`readMode` derives no case, because Assayer cannot construct `config: Config`.' }],
  darkSpots: [],
  undriven: [],
  lints: [],
  declaredTypes: [],
  declaringScopes: [],
});

describe('compiledAnalysisResolveBroker', () => {
  it('EMPTY: {blob carries no analysis} => returns undefined', async () => {
    compiledAnalysisResolveBrokerProxy();

    const result = await compiledAnalysisResolveBroker({
      repoPath: '/config',
      relPath: 'src/reader.ts',
      blob: CompiledFileBlobStub({ relPath: 'src/reader.ts' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {source file cannot be read and no harness sits beside it} => returns the persisted analysis unchanged', async () => {
    const proxy = compiledAnalysisResolveBrokerProxy();
    proxy.sourceRootRepoRoot({ repoPath: '/config', repoRoot: '../repo' });
    proxy.sourceMissing({ root: '/repo', relPath: 'src/reader.ts' });
    proxy.harnessMissing({ path: '/repo/src/reader.harness.ts' });

    const result = await compiledAnalysisResolveBroker({
      repoPath: '/config',
      relPath: 'src/reader.ts',
      blob: CompiledFileBlobStub({ relPath: 'src/reader.ts', analysis: READER_ANALYSIS }),
    });

    expect(result).toStrictEqual(READER_ANALYSIS);
  });

  it('VALID: {parameter declared as an imported type} => serves the declared shape and no longer reports the gap', async () => {
    const proxy = compiledAnalysisResolveBrokerProxy();
    proxy.sourceRootRepoRoot({ repoPath: '/config', repoRoot: '../repo' });
    proxy.sourceReads({ root: '/repo', relPath: 'src/reader.ts', content: READER_SOURCE });
    proxy.siblingResolvesTo({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE, specifier: './types' });

    const result = await compiledAnalysisResolveBroker({
      repoPath: '/config',
      relPath: 'src/reader.ts',
      blob: CompiledFileBlobStub({ relPath: 'src/reader.ts', analysis: READER_ANALYSIS }),
    });

    expect({
      cases: result?.functions.flatMap((fn) => fn.cases),
      gaps: result?.gaps,
    }).toStrictEqual({
      cases: [
        {
          reachesPath: ['*module*/readMode/return@top'],
          arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123', region: 'abc123' } }],
          arms: [],
          driven: true,
          fewestRuns: true,
        },
      ],
      gaps: [],
    });
  });
});
