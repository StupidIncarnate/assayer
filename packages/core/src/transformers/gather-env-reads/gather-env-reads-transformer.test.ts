import { CompiledFileBlobStub, FileAnalysisStub, FunctionAnalysisStub } from '@assayer/shared/contracts';

import { gatherEnvReadsTransformer } from './gather-env-reads-transformer';

const codeSwitchFunction = FunctionAnalysisStub({
  entry: {
    name: '*module*',
    scopePath: ['*module*'],
    params: [],
    returnType: { kind: 'unknown', text: 'void' },
    line: 1,
    access: { kind: 'module' },
  },
  branches: [
    {
      coverageId: '*module*/switch:id:code,eq,num:1',
      kind: 'switch',
      condition: {
        kind: 'leaf',
        id: '*module*/switch:id:code,eq,num:1#leaf',
        operandEnvVarName: 'CODE',
        operandType: { kind: 'number' },
        predicate: { kind: 'eq', literal: 1 },
      },
      startLine: 3,
      endLine: 4,
    },
    {
      coverageId: '*module*/switch:id:code,eq,num:2',
      kind: 'switch',
      condition: {
        kind: 'leaf',
        id: '*module*/switch:id:code,eq,num:2#leaf',
        operandEnvVarName: 'CODE',
        operandType: { kind: 'number' },
        predicate: { kind: 'eq', literal: 2 },
      },
      startLine: 5,
      endLine: 6,
    },
  ],
  exits: [],
  cases: [],
});

describe('gatherEnvReadsTransformer', () => {
  describe('one file reading two env properties', () => {
    it('VALID: {CODE from switch leaves, MODE from a bare compare} => one group per property, keyed and unioned', () => {
      const blob = CompiledFileBlobStub({
        relPath: 'src/multi.ts',
        moduleGraph: {
          edges: [],
          references: [],
          globalUses: [],
          envReads: [
            { property: 'CODE', literals: [] },
            { property: 'MODE', literals: ['production'] },
          ],
        },
        analysis: FileAnalysisStub({ functions: [codeSwitchFunction] }),
      });

      expect(gatherEnvReadsTransformer({ blobs: [blob] })).toStrictEqual([
        { property: 'CODE', literals: [1, 2], readers: ['src/multi.ts'] },
        { property: 'MODE', literals: ['production'], readers: ['src/multi.ts'] },
      ]);
    });
  });

  describe('two files reading the same property', () => {
    it('VALID: {CODE read in two files} => one group, readers sorted and deduped', () => {
      const first = CompiledFileBlobStub({
        relPath: 'src/b-reader.ts',
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [{ property: 'CODE', literals: [] }] },
        analysis: FileAnalysisStub({ functions: [codeSwitchFunction] }),
      });
      const second = CompiledFileBlobStub({
        relPath: 'src/a-reader.ts',
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [{ property: 'CODE', literals: ['x'] }] },
        analysis: FileAnalysisStub({ functions: [] }),
      });

      // Literals ride in blob-sorted (relPath) order — `a-reader` before `b-reader` — deterministic
      // regardless of input order; the final env-stub value math sorts them downstream.
      expect(gatherEnvReadsTransformer({ blobs: [first, second] })).toStrictEqual([
        { property: 'CODE', literals: ['x', 1, 2], readers: ['src/a-reader.ts', 'src/b-reader.ts'] },
      ]);
    });
  });

  describe('a file with no env reads', () => {
    it('EMPTY: {no env reads anywhere} => no groups', () => {
      const blob = CompiledFileBlobStub({ relPath: 'src/plain.ts', analysis: FileAnalysisStub({ functions: [] }) });

      expect(gatherEnvReadsTransformer({ blobs: [blob] })).toStrictEqual([]);
    });
  });
});
