import { CompiledFileBlobStub, FileAnalysisStub, ResolvedEdgeStub, ResolvedIndexStub } from '@assayer/shared/contracts';

import { gatherTypeReadsTransformer } from './gather-type-reads-transformer';

const EMPTY_INDEX = ResolvedIndexStub({ edges: [] });

const blobReadingConfigMode = CompiledFileBlobStub({
  relPath: 'src/config/config.ts',
  analysis: FileAnalysisStub({
    declaredTypes: [{ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
    functions: [
      {
        entry: {
          name: 'decide',
          scopePath: ['*module*', 'decide'],
          params: [{ name: 'config', type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] } }],
          returnType: { kind: 'string' },
          line: 5,
          access: { kind: 'named' },
        },
        branches: [
          {
            coverageId: 'decide/if:config.mode===a',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: 'decide/if:config.mode===a#leaf',
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
        exits: [{ coverageId: 'decide/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'decide/if:config.mode===a', arm: 'then' }], line: 7 }],
        cases: [],
      },
    ],
  }),
});

const typesBlob = CompiledFileBlobStub({
  relPath: 'src/types/types.ts',
  analysis: FileAnalysisStub({
    declaredTypes: [
      {
        name: 'Config',
        properties: [
          { name: 'mode', type: { kind: 'string' } },
          { name: 'region', type: { kind: 'string' } },
          { name: 'retries', type: { kind: 'number' } },
        ],
      },
    ],
    functions: [],
  }),
});

const readerA = CompiledFileBlobStub({
  relPath: 'src/a/reader-a.ts',
  analysis: FileAnalysisStub({
    declaredTypes: [],
    functions: [
      {
        entry: {
          name: 'decideA',
          scopePath: ['*module*', 'decideA'],
          params: [{ name: 'config', type: { kind: 'unknown', text: 'Config' } }],
          returnType: { kind: 'string' },
          line: 3,
          access: { kind: 'named' },
        },
        branches: [
          {
            coverageId: 'decideA/if:config.mode===a',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: 'decideA/if:config.mode===a#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['mode'],
              operandTypeRef: 'Config',
              operandType: { kind: 'unknown', text: 'any' },
              predicate: { kind: 'eq', literal: 'a' },
            },
            startLine: 4,
            endLine: 6,
          },
        ],
        exits: [{ coverageId: 'decideA/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'decideA/if:config.mode===a', arm: 'then' }], line: 5 }],
        cases: [],
      },
    ],
  }),
});

const readerB = CompiledFileBlobStub({
  relPath: 'src/b/reader-b.ts',
  analysis: FileAnalysisStub({
    declaredTypes: [],
    functions: [
      {
        entry: {
          name: 'decideB',
          scopePath: ['*module*', 'decideB'],
          params: [{ name: 'config', type: { kind: 'unknown', text: 'Config' } }],
          returnType: { kind: 'string' },
          line: 3,
          access: { kind: 'named' },
        },
        branches: [
          {
            coverageId: 'decideB/if:config.region===us',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: 'decideB/if:config.region===us#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['region'],
              operandTypeRef: 'Config',
              operandType: { kind: 'unknown', text: 'any' },
              predicate: { kind: 'eq', literal: 'us' },
            },
            startLine: 4,
            endLine: 6,
          },
        ],
        exits: [{ coverageId: 'decideB/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'decideB/if:config.region===us', arm: 'then' }], line: 5 }],
        cases: [],
      },
    ],
  }),
});

const crossFileIndex = ResolvedIndexStub({
  edges: [
    ResolvedEdgeStub({ from: 'src/a/reader-a.ts', specifier: '../types/types', importedName: 'Config', target: { kind: 'local', relPath: 'src/types/types.ts' } }),
    ResolvedEdgeStub({ from: 'src/b/reader-b.ts', specifier: '../types/types', importedName: 'Config', target: { kind: 'local', relPath: 'src/types/types.ts' } }),
  ],
});

describe('gatherTypeReadsTransformer', () => {
  describe('a file declaring a type it reads (same-file)', () => {
    it('VALID: {Config declared, config.mode read in the same file} => one group: the type, its declaring file as reader, and the matching leaf', () => {
      const result = gatherTypeReadsTransformer({ blobs: [blobReadingConfigMode], resolvedIndex: EMPTY_INDEX });

      expect(result).toStrictEqual([
        {
          definitionRelPath: 'src/config/config.ts',
          typeName: 'Config',
          declaredType: { name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
          readers: ['src/config/config.ts'],
          leaves: [
            {
              kind: 'leaf',
              id: 'decide/if:config.mode===a#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['mode'],
              operandTypeRef: 'Config',
              operandType: { kind: 'string' },
              predicate: { kind: 'eq', literal: 'a' },
            },
          ],
        },
      ]);
    });
  });

  describe('a type declared in one file and read by several others (cross-file union)', () => {
    it('VALID: {Config in types.ts; reader-a reads .mode, reader-b reads .region} => one group keyed on types.ts with both readers and both leaves', () => {
      const result = gatherTypeReadsTransformer({ blobs: [typesBlob, readerA, readerB], resolvedIndex: crossFileIndex });

      expect(result).toStrictEqual([
        {
          definitionRelPath: 'src/types/types.ts',
          typeName: 'Config',
          declaredType: {
            name: 'Config',
            properties: [
              { name: 'mode', type: { kind: 'string' } },
              { name: 'region', type: { kind: 'string' } },
              { name: 'retries', type: { kind: 'number' } },
            ],
          },
          readers: ['src/a/reader-a.ts', 'src/b/reader-b.ts'],
          leaves: [
            {
              kind: 'leaf',
              id: 'decideA/if:config.mode===a#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['mode'],
              operandTypeRef: 'Config',
              operandType: { kind: 'unknown', text: 'any' },
              predicate: { kind: 'eq', literal: 'a' },
            },
            {
              kind: 'leaf',
              id: 'decideB/if:config.region===us#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['region'],
              operandTypeRef: 'Config',
              operandType: { kind: 'unknown', text: 'any' },
              predicate: { kind: 'eq', literal: 'us' },
            },
          ],
        },
      ]);
    });
  });

  describe('a type declared but read by no file', () => {
    it('VALID: {Other declared, no leaf references it} => a group with no readers and no leaves (its properties degrade to unknown downstream)', () => {
      const blob = CompiledFileBlobStub({
        relPath: 'src/other/other.ts',
        analysis: FileAnalysisStub({
          declaredTypes: [{ name: 'Other', properties: [{ name: 'flag', type: { kind: 'boolean' } }] }],
          functions: [],
        }),
      });

      const result = gatherTypeReadsTransformer({ blobs: [blob], resolvedIndex: EMPTY_INDEX });

      expect(result).toStrictEqual([
        {
          definitionRelPath: 'src/other/other.ts',
          typeName: 'Other',
          declaredType: { name: 'Other', properties: [{ name: 'flag', type: { kind: 'boolean' } }] },
          readers: [],
          leaves: [],
        },
      ]);
    });
  });

  describe('a file that declares no types', () => {
    it('EMPTY: {no declared types} => no groups', () => {
      const blob = CompiledFileBlobStub({ relPath: 'src/plain.ts', analysis: FileAnalysisStub({ functions: [], declaredTypes: [] }) });

      const result = gatherTypeReadsTransformer({ blobs: [blob], resolvedIndex: EMPTY_INDEX });

      expect(result).toStrictEqual([]);
    });
  });
});
