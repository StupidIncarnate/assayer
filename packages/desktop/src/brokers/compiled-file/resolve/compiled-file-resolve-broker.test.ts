import { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';
import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';
import { ResolvedEdgeStub } from '@assayer/shared/contracts/resolved-edge/resolved-edge.stub';
import { ResolvedIndexStub } from '@assayer/shared/contracts/resolved-index/resolved-index.stub';

import { compiledFileResolveBroker } from './compiled-file-resolve-broker';
import { compiledFileResolveBrokerProxy } from './compiled-file-resolve-broker.proxy';

// Each source below is the file the served view is about. Its persisted analysis is the per-file result
// compile writes into the blob: the branches and exits the walk found, the cases it could derive with
// nothing but the file in hand, and what it could not derive yet. The overlays under test close those
// admissions at serve time, against the sources staged beside it.

const CLASSIFY_SOURCE =
  "import { big } from './big';\n\nexport function classify(n: number): string {\n  if (big(n)) {\n    return 'B';\n  }\n\n  return 'S';\n}\n";
const BIG_PREDICATE = 'export function big(n: number): boolean {\n  return n > 50;\n}\n';
const CLASSIFY_BRANCH = '*module*/classify/if:CallExpression,id:big,id:n';
const CLASSIFY_ANALYSIS = FileAnalysisStub({
  functions: [
    {
      entry: {
        name: 'classify',
        scopePath: ['*module*', 'classify'],
        params: [{ name: 'n', type: { kind: 'number' } }],
        returnType: { kind: 'string' },
        line: 3,
        access: { kind: 'named' },
      },
      branches: [
        {
          coverageId: CLASSIFY_BRANCH,
          kind: 'if',
          condition: {
            kind: 'leaf',
            id: `${CLASSIFY_BRANCH}#leaf`,
            operandCallPosition: { line: 4, column: 7 },
            operandType: { kind: 'unknown', text: 'any' },
            predicate: { kind: 'truthy' },
          },
          startLine: 4,
          endLine: 6,
        },
      ],
      exits: [
        {
          coverageId: `*module*/classify/return@if:CallExpression,id:big,id:n#then`,
          kind: 'return',
          guardPath: [{ branchCoverageId: CLASSIFY_BRANCH, arm: 'then' }],
          line: 5,
        },
        {
          coverageId: `*module*/classify/return@if:CallExpression,id:big,id:n#else`,
          kind: 'return',
          guardPath: [{ branchCoverageId: CLASSIFY_BRANCH, arm: 'else' }],
          line: 8,
        },
      ],
      cases: [],
    },
  ],
  enrichment: [{ line: 3, symbol: 'n', typeText: 'number' }],
  gaps: [],
  darkSpots: [],
  undriven: [{ name: 'classify', reason: 'the guard on line 4 calls an imported predicate', startLine: 4, endLine: 4 }],
  lints: [],
  declaredTypes: [],
  declaringScopes: [],
});

const TYPES_SOURCE =
  "export interface Config {\n  mode: string;\n  region: string;\n}\n\nexport type Level = 'low' | 'high';\n\nexport type Id = string;\n\nexport function withDefaults(config: Config): Config {\n  return config;\n}\n";
const READER_SOURCE =
  "import type { Config } from './types';\n\nexport function readMode(config: Config): string {\n  return config.mode;\n}\n";
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

const DECIDE_SOURCE =
  "interface Config {\n  mode: string;\n}\n\nexport function decide(config: Config): string {\n  if (config.mode === 'a') {\n    return 'x';\n  }\n\n  return 'y';\n}\n";
const DECIDE_BRANCH = '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a';
const DECIDE_THEN = '*module*/decide/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#then';
const DECIDE_ELSE = '*module*/decide/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#else';
const DECIDE_ANALYSIS = FileAnalysisStub({
  functions: [
    {
      entry: {
        name: 'decide',
        scopePath: ['*module*', 'decide'],
        params: [
          {
            name: 'config',
            type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
          },
        ],
        returnType: { kind: 'string' },
        line: 5,
        access: { kind: 'named' },
      },
      branches: [
        {
          coverageId: DECIDE_BRANCH,
          kind: 'if',
          condition: {
            kind: 'leaf',
            id: `${DECIDE_BRANCH}#leaf`,
            operandParamName: 'config',
            operandPropertyPath: ['mode'],
            operandTypeRef: 'Config',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'a' },
          },
          startLine: 6,
          endLine: 8,
        },
      ],
      exits: [
        {
          coverageId: DECIDE_THEN,
          kind: 'return',
          guardPath: [{ branchCoverageId: DECIDE_BRANCH, arm: 'then' }],
          line: 7,
        },
        {
          coverageId: DECIDE_ELSE,
          kind: 'return',
          guardPath: [{ branchCoverageId: DECIDE_BRANCH, arm: 'else' }],
          line: 10,
        },
      ],
      cases: [],
    },
  ],
  enrichment: [
    { line: 5, symbol: 'config', typeText: 'Config' },
    { line: 6, symbol: 'config', typeText: 'string', range: ['a'] },
  ],
  gaps: [],
  darkSpots: [],
  undriven: [{ name: 'decide', reason: 'the guard on line 6 reads `config.mode`', startLine: 6, endLine: 6 }],
  lints: [],
  declaredTypes: [{ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
  declaringScopes: [],
});

const MAP_PARENT_SOURCE =
  "import { bandReading } from './band-reading';\nexport function bandReadings(items: number[]): string[] {\n  return items.map(bandReading);\n}\n";
const MAP_CHILD_SOURCE =
  'export function bandReading(n: number): string {\n  if (n >= 80) {\n    return "high";\n  }\n  if (n < 20) {\n    return "low";\n  }\n  return "mid";\n}\n';
const BAND_HIGH = 'if:BinaryExpression,id:n,GreaterThanEqualsToken,num:80';
const BAND_LOW = 'if:BinaryExpression,id:n,LessThanToken,num:20';
const HIGH_EXIT = `*module*/bandReading/return@${BAND_HIGH}#then`;
const LOW_EXIT = `*module*/bandReading/return@${BAND_HIGH}#else/${BAND_LOW}#then`;
const MID_EXIT = `*module*/bandReading/return@${BAND_HIGH}#else/${BAND_LOW}#else`;
const READINGS_EXIT = '*module*/bandReadings/return@top';
const MAP_ANALYSIS = FileAnalysisStub({
  functions: [
    {
      entry: {
        name: 'bandReadings',
        scopePath: ['*module*', 'bandReadings'],
        params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
        returnType: { kind: 'array', element: { kind: 'string' } },
        line: 2,
        access: { kind: 'named' },
      },
      branches: [],
      exits: [{ coverageId: READINGS_EXIT, kind: 'return', guardPath: [], line: 3 }],
      cases: [
        { reachesPath: [READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [] }], salient: true },
        { reachesPath: [READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [7] }], salient: false },
        { reachesPath: [READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [7, 7] }], salient: false },
      ],
    },
  ],
  enrichment: [{ line: 2, symbol: 'items', typeText: 'number[]' }],
  gaps: [],
  darkSpots: [],
  undriven: [],
  lints: [],
  declaredTypes: [],
  declaringScopes: [],
});

const AUDIT_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { audit: { report: (message: string): string => message } } });\n";
const AUDIT_BRANCH = '*module*/audit/if:BinaryExpression,id:score,GreaterThanToken,num:5';
const AUDIT_THEN = '*module*/audit/return@if:BinaryExpression,id:score,GreaterThanToken,num:5#then';
const AUDIT_ELSE = '*module*/audit/return@if:BinaryExpression,id:score,GreaterThanToken,num:5#else';
const CALLBACK_ANALYSIS = FileAnalysisStub({
  functions: [
    {
      entry: {
        name: 'audit',
        scopePath: ['*module*', 'audit'],
        params: [
          { name: 'score', type: { kind: 'number' } },
          { name: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
        ],
        returnType: { kind: 'string' },
        line: 1,
        access: { kind: 'named' },
      },
      branches: [
        {
          coverageId: AUDIT_BRANCH,
          kind: 'if',
          condition: {
            kind: 'leaf',
            id: `${AUDIT_BRANCH}#leaf`,
            operandParamName: 'score',
            operandType: { kind: 'number' },
            predicate: { kind: 'gt', literal: 5 },
          },
          startLine: 2,
          endLine: 4,
        },
      ],
      exits: [
        {
          coverageId: AUDIT_THEN,
          kind: 'return',
          guardPath: [{ branchCoverageId: AUDIT_BRANCH, arm: 'then' }],
          line: 3,
        },
        {
          coverageId: AUDIT_ELSE,
          kind: 'return',
          guardPath: [{ branchCoverageId: AUDIT_BRANCH, arm: 'else' }],
          line: 6,
        },
      ],
      cases: [],
    },
  ],
  enrichment: [
    { line: 1, symbol: 'score', typeText: 'number' },
    { line: 1, symbol: 'report', typeText: '(message: string) => string' },
    { line: 2, symbol: 'score', typeText: 'number', range: [6, 5] },
  ],
  gaps: [{ name: 'audit', reason: '`audit` derives no case, because Assayer cannot construct `report: (message: string) => string`.' }],
  darkSpots: [],
  undriven: [],
  lints: [],
  declaredTypes: [],
  declaringScopes: [],
});

const FUNNELLED_SOURCE =
  "const build = (size: number, report: (message: string) => string): string => {\n  if (size > 10) {\n    return report('over');\n  }\n\n  return report('under');\n};\n\nexport function audit(size: number): string {\n  return build(size, (m) => m);\n}\n";
const FUNNELLED_HARNESS =
  "import { assayerHarness } from '@assayer/core';\n\nassayerHarness({ inputs: { build: { report: (message: string): string => message } } });\n";
const FUNNELLED_THEN = '*module*/build/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#then';
const FUNNELLED_ELSE = '*module*/build/return@if:BinaryExpression,id:size,GreaterThanToken,num:10#else';
const AUDIT_TOP = '*module*/audit/return@top';
const FUNNELLED_ANALYSIS = FileAnalysisStub({
  functions: [
    {
      entry: {
        name: 'audit',
        scopePath: ['*module*', 'audit'],
        params: [{ name: 'size', type: { kind: 'number' } }],
        returnType: { kind: 'string' },
        line: 9,
        access: { kind: 'named' },
      },
      branches: [],
      exits: [{ coverageId: AUDIT_TOP, kind: 'return', guardPath: [], line: 10 }],
      cases: [],
    },
  ],
  enrichment: [{ line: 9, symbol: 'size', typeText: 'number' }],
  gaps: [{ name: 'audit', reason: '`audit` derives no case, because Assayer cannot construct `report` on `build`.' }],
  darkSpots: [],
  undriven: [],
  lints: [],
  declaredTypes: [],
  declaringScopes: [
    {
      name: 'build',
      hostEntry: 'audit',
      params: [
        { name: 'size', type: { kind: 'number' } },
        { name: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
      ],
    },
  ],
});

describe('compiledFileResolveBroker', () => {
  describe('successful resolve', () => {
    it('VALID: {relPath present in current namespace} => resolves the compiled file view with no edges', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          main: {
            files: [{ relPath: 'src/index.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }],
          },
        },
      });
      const blob = CompiledFileBlobStub();

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/repo', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/repo', namespace: 'main' });
      proxy.setupBlob({ repoPath: '/repo', analysisHash: 'b'.repeat(64), blob });

      const result = await compiledFileResolveBroker({
        repoPath: '/repo',
        relPath: 'src/index.ts',
      });

      const { displayLines, nodes, contentHash } = blob;

      expect(result).toStrictEqual({ relPath: 'src/index.ts', contentHash, displayLines, nodes, resolvedEdges: [] });
    });

    it('VALID: {resolved index has edges from this file and others} => keeps only the edges whose from is this file', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/index.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });
      const ownEdge = ResolvedEdgeStub({
        from: 'src/index.ts',
        specifier: './greeting',
        importedName: 'greeting',
        target: { kind: 'local', relPath: 'src/greeting.ts' },
      });
      const otherEdge = ResolvedEdgeStub({ from: 'src/other.ts', specifier: './x', importedName: 'x' });
      const index = ResolvedIndexStub({ edges: [ownEdge, otherEdge] });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/repo', manifest });
      proxy.setupBlob({ repoPath: '/repo', analysisHash: 'b'.repeat(64), blob: CompiledFileBlobStub() });
      proxy.setupResolvedIndex({ repoPath: '/repo', namespace: 'main', index });

      const result = await compiledFileResolveBroker({
        repoPath: '/repo',
        relPath: 'src/index.ts',
      });

      expect(result.resolvedEdges).toStrictEqual([ownEdge]);
    });
  });

  describe('cross-file predicate overlay', () => {
    it('VALID: {caller guarding on an imported predicate} => serves the composed cases for both arms', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/classify.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/config', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/config', namespace: 'main' });
      proxy.setupBlob({
        repoPath: '/config',
        analysisHash: 'b'.repeat(64),
        blob: CompiledFileBlobStub({ relPath: 'src/classify.ts', analysis: CLASSIFY_ANALYSIS }),
      });
      // Config dir is /config; the source root resolves a level away to /repo. The overlays must be
      // handed the SOURCE root, not the config dir.
      proxy.sourceRootRepoRoot({ repoPath: '/config', repoRoot: '../repo' });
      proxy.sourceReads({ root: '/repo', relPath: 'src/classify.ts', content: CLASSIFY_SOURCE });
      proxy.siblingResolvesTo({ fileName: '/repo/src/big.ts', source: BIG_PREDICATE, specifier: './big' });

      const result = await compiledFileResolveBroker({
        repoPath: '/config',
        relPath: 'src/classify.ts',
      });

      expect({
        cases: result.analysis?.functions.flatMap((fn) => fn.cases),
        lints: result.analysis?.lints,
      }).toStrictEqual({
        cases: [
          {
            reachesPath: ['*module*/classify/return@if:CallExpression,id:big,id:n#then'],
            arrange: [{ kind: 'param', param: 'n', value: 51 }],
            salient: true,
          },
          {
            reachesPath: ['*module*/classify/return@if:CallExpression,id:big,id:n#else'],
            arrange: [{ kind: 'param', param: 'n', value: 50 }],
            salient: true,
          },
        ],
        lints: [],
      });
    });

    it('VALID: {plain caller with no imported-predicate guard} => serves the persisted analysis unchanged', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/audit.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/repo', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/repo', namespace: 'main' });
      proxy.setupBlob({
        repoPath: '/repo',
        analysisHash: 'b'.repeat(64),
        blob: CompiledFileBlobStub({ relPath: 'src/audit.ts', analysis: MAP_ANALYSIS }),
      });
      proxy.sourceRootRepoRoot({ repoPath: '/repo', repoRoot: '.' });
      proxy.sourceReads({ root: '/repo', relPath: 'src/audit.ts', content: 'export const x = 1;\n' });

      const result = await compiledFileResolveBroker({
        repoPath: '/repo',
        relPath: 'src/audit.ts',
      });

      expect(result.analysis).toStrictEqual(MAP_ANALYSIS);
    });

    it('EMPTY: {caller source cannot be read} => falls back to the opaque persisted analysis', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/classify.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/repo', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/repo', namespace: 'main' });
      proxy.setupBlob({
        repoPath: '/repo',
        analysisHash: 'b'.repeat(64),
        blob: CompiledFileBlobStub({ relPath: 'src/classify.ts', analysis: CLASSIFY_ANALYSIS }),
      });
      proxy.sourceRootRepoRoot({ repoPath: '/repo', repoRoot: '.' });
      proxy.sourceMissing({ root: '/repo', relPath: 'src/classify.ts' });

      const result = await compiledFileResolveBroker({
        repoPath: '/repo',
        relPath: 'src/classify.ts',
      });

      expect(result.analysis).toStrictEqual(CLASSIFY_ANALYSIS);
    });
  });

  describe('param-type overlay', () => {
    it('VALID: {caller with an imported-type parameter} => serves the declared shape and no longer reports the gap', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/reader.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/config', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/config', namespace: 'main' });
      proxy.setupBlob({
        repoPath: '/config',
        analysisHash: 'b'.repeat(64),
        blob: CompiledFileBlobStub({ relPath: 'src/reader.ts', analysis: READER_ANALYSIS }),
      });
      proxy.sourceRootRepoRoot({ repoPath: '/config', repoRoot: '../repo' });
      proxy.sourceReads({ root: '/repo', relPath: 'src/reader.ts', content: READER_SOURCE });
      proxy.siblingResolvesTo({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE, specifier: './types' });

      const result = await compiledFileResolveBroker({
        repoPath: '/config',
        relPath: 'src/reader.ts',
      });

      expect({
        params: result.analysis?.functions.flatMap((fn) => fn.entry.params),
        cases: result.analysis?.functions.flatMap((fn) => fn.cases),
        gaps: result.analysis?.gaps,
      }).toStrictEqual({
        params: [
          {
            name: 'config',
            type: {
              kind: 'object',
              typeName: 'Config',
              properties: [
                { name: 'mode', type: { kind: 'string' } },
                { name: 'region', type: { kind: 'string' } },
              ],
            },
          },
        ],
        cases: [
          {
            reachesPath: ['*module*/readMode/return@top'],
            arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123', region: 'abc123' } }],
            salient: true,
          },
        ],
        gaps: [],
      });
    });
  });

  describe('stub-arrange overlay', () => {
    it('VALID: {caller with an object-member branch} => serves both arms driven and nothing undriven', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/decide.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/config', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/config', namespace: 'main' });
      proxy.setupBlob({
        repoPath: '/config',
        analysisHash: 'b'.repeat(64),
        blob: CompiledFileBlobStub({ relPath: 'src/decide.ts', analysis: DECIDE_ANALYSIS }),
      });
      proxy.sourceRootRepoRoot({ repoPath: '/config', repoRoot: '../repo' });
      proxy.sourceReads({ root: '/repo', relPath: 'src/decide.ts', content: DECIDE_SOURCE });

      const result = await compiledFileResolveBroker({
        repoPath: '/config',
        relPath: 'src/decide.ts',
      });

      expect({
        cases: result.analysis?.functions.flatMap((fn) => fn.cases),
        undriven: result.analysis?.undriven,
      }).toStrictEqual({
        cases: [
          { reachesPath: [DECIDE_THEN], arrange: [{ kind: 'object', param: 'config', value: { mode: 'a' } }], salient: true },
          { reachesPath: [DECIDE_ELSE], arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123' } }], salient: true },
        ],
        undriven: [],
      });
    });
  });

  describe('cross-file-map overlay', () => {
    it('VALID: {caller mapping an imported function over an array param} => serves the callee branches folded into the host cases', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/cross-file-map.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/config', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/config', namespace: 'main' });
      proxy.setupBlob({
        repoPath: '/config',
        analysisHash: 'b'.repeat(64),
        blob: CompiledFileBlobStub({ relPath: 'src/cross-file-map.ts', analysis: MAP_ANALYSIS }),
      });
      proxy.sourceRootRepoRoot({ repoPath: '/config', repoRoot: '../repo' });
      proxy.sourceReads({ root: '/repo', relPath: 'src/cross-file-map.ts', content: MAP_PARENT_SOURCE });
      proxy.siblingResolvesTo({ fileName: '/repo/src/band-reading.ts', source: MAP_CHILD_SOURCE, specifier: './band-reading' });

      const result = await compiledFileResolveBroker({
        repoPath: '/config',
        relPath: 'src/cross-file-map.ts',
      });

      expect(result.analysis?.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        { reachesPath: [READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [] }], salient: true },
        { reachesPath: [HIGH_EXIT, READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [80] }], salient: true },
        { reachesPath: [LOW_EXIT, READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [19] }], salient: true },
        { reachesPath: [MID_EXIT, READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [79] }], salient: true },
        { reachesPath: [HIGH_EXIT, LOW_EXIT, READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [80, 19] }], salient: true },
      ]);
    });
  });

  describe('harness overlay', () => {
    // A refusal owned by a funnelled private is invoiced against its HOST, and paying it needs the raw
    // `walked` parse re-run through `follow-calls`. Both arms deriving, with the gap closed, proves the
    // caller's walked parse reached the overlay.
    it('VALID: {a harness naming a funnelled private that owns the refusal} => serves both arms through the private and closes the gap', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/audit.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/config', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/config', namespace: 'main' });
      proxy.setupBlob({
        repoPath: '/config',
        analysisHash: 'b'.repeat(64),
        blob: CompiledFileBlobStub({ relPath: 'src/audit.ts', analysis: FUNNELLED_ANALYSIS }),
      });
      proxy.sourceRootRepoRoot({ repoPath: '/config', repoRoot: '../repo' });
      proxy.sourceReads({ root: '/repo', relPath: 'src/audit.ts', content: FUNNELLED_SOURCE });
      proxy.harnessReads({ path: '/repo/src/audit.harness.ts', source: FUNNELLED_HARNESS });

      const result = await compiledFileResolveBroker({
        repoPath: '/config',
        relPath: 'src/audit.ts',
      });

      expect({
        cases: result.analysis?.functions.flatMap((fn) => fn.cases),
        gaps: result.analysis?.gaps,
      }).toStrictEqual({
        cases: [
          { reachesPath: [FUNNELLED_THEN, AUDIT_TOP], arrange: [{ kind: 'param', param: 'size', value: 11 }], salient: true },
          { reachesPath: [FUNNELLED_ELSE, AUDIT_TOP], arrange: [{ kind: 'param', param: 'size', value: 10 }], salient: true },
        ],
        gaps: [],
      });
    });

    // The harness overlay reads the COLOCATED harness file itself, so it still applies when the
    // caller's own source cannot be read. With nothing to walk, it pays the entry's own refused
    // parameter and nothing more.
    it('VALID: {caller source cannot be read} => the harness overlay still pays the entry its own refused parameter', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/audit.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/repo', manifest });
      proxy.setupNoResolvedIndex({ repoPath: '/repo', namespace: 'main' });
      proxy.setupBlob({
        repoPath: '/repo',
        analysisHash: 'b'.repeat(64),
        blob: CompiledFileBlobStub({ relPath: 'src/audit.ts', analysis: CALLBACK_ANALYSIS }),
      });
      proxy.sourceRootRepoRoot({ repoPath: '/repo', repoRoot: '.' });
      proxy.sourceMissing({ root: '/repo', relPath: 'src/audit.ts' });
      proxy.harnessReads({ path: '/repo/src/audit.harness.ts', source: AUDIT_HARNESS });

      const result = await compiledFileResolveBroker({
        repoPath: '/repo',
        relPath: 'src/audit.ts',
      });

      expect({
        cases: result.analysis?.functions.flatMap((fn) => fn.cases),
        gaps: result.analysis?.gaps,
      }).toStrictEqual({
        cases: [
          {
            reachesPath: [AUDIT_THEN],
            arrange: [
              { kind: 'param', param: 'score', value: 6 },
              { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
            ],
            salient: true,
          },
          {
            reachesPath: [AUDIT_ELSE],
            arrange: [
              { kind: 'param', param: 'score', value: 5 },
              { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
            ],
            salient: true,
          },
        ],
        gaps: [],
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {relPath not present in current namespace} => throws naming the requested relPath', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          main: {
            files: [{ relPath: 'other.ts', contentHash: 'a'.repeat(64), analysisHash: 'b'.repeat(64) }],
          },
        },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ repoPath: '/repo', manifest });

      await expect(
        compiledFileResolveBroker({
          repoPath: '/repo',
          relPath: 'missing.ts',
        }),
      ).rejects.toThrow(/missing\.ts/u);
    });
  });
});
