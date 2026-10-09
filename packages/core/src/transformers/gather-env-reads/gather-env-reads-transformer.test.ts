import { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';
import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';
import { FunctionAnalysisStub } from '@assayer/shared/contracts/function-analysis/function-analysis.stub';

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
const { entry: moduleEntry } = codeSwitchFunction;

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

  describe('a leaf whose steps change what its literal means', () => {
    it("VALID: {const flag = process.env.FLAG === 'on'; if (flag === false)} => the comparison's literal, never the boolean", () => {
      const blob = CompiledFileBlobStub({
        relPath: 'src/flag.ts',
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [] },
        analysis: FileAnalysisStub({
          functions: [
            FunctionAnalysisStub({
              entry: moduleEntry,
              branches: [
                {
                  coverageId: '*module*/if:id:flag,EqualsEqualsEqualsToken,false',
                  kind: 'if',
                  condition: {
                    kind: 'leaf',
                    id: '*module*/if:id:flag,EqualsEqualsEqualsToken,false#leaf',
                    operandParamName: 'flag',
                    operandEnvVarName: 'FLAG',
                    operandEnvSteps: [{ kind: 'equals', literal: 'on', negated: false }],
                    operandType: { kind: 'boolean' },
                    predicate: { kind: 'eq', literal: false },
                  },
                  startLine: 2,
                  endLine: 2,
                },
              ],
              exits: [],
              cases: [],
            }),
          ],
        }),
      });

      expect(gatherEnvReadsTransformer({ blobs: [blob] })).toStrictEqual([
        { property: 'FLAG', literals: ['on'], readers: ['src/flag.ts'] },
      ]);
    });

    it("VALID: {const text = process.env.TEXT ?? ''; if (text.length > 3)} => no literal, since 3 is a length", () => {
      const blob = CompiledFileBlobStub({
        relPath: 'src/text.ts',
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [] },
        analysis: FileAnalysisStub({
          functions: [
            FunctionAnalysisStub({
              entry: moduleEntry,
              branches: [
                {
                  coverageId: '*module*/if:id:text,length,GreaterThanToken,num:3',
                  kind: 'if',
                  condition: {
                    kind: 'leaf',
                    id: '*module*/if:id:text,length,GreaterThanToken,num:3#leaf',
                    operandParamName: 'text',
                    operandEnvVarName: 'TEXT',
                    operandEnvSteps: [{ kind: 'default', value: '' }],
                    operandType: { kind: 'string' },
                    predicate: { kind: 'length-gt', literal: 3 },
                  },
                  startLine: 2,
                  endLine: 2,
                },
              ],
              exits: [],
              cases: [],
            }),
          ],
        }),
      });

      expect(gatherEnvReadsTransformer({ blobs: [blob] })).toStrictEqual([
        { property: 'TEXT', literals: [], readers: ['src/text.ts'] },
      ]);
    });

    it('VALID: {a guarded Number read compared with 5} => 5, since a guard keeps a set variable as it is', () => {
      const blob = CompiledFileBlobStub({
        relPath: 'src/guarded.ts',
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [] },
        analysis: FileAnalysisStub({
          functions: [
            FunctionAnalysisStub({
              entry: moduleEntry,
              branches: [
                {
                  coverageId: '*module*/if:id:value,EqualsEqualsEqualsToken,num:5',
                  kind: 'if',
                  condition: {
                    kind: 'leaf',
                    id: '*module*/if:id:value,EqualsEqualsEqualsToken,num:5#leaf',
                    operandParamName: 'value',
                    operandEnvVarName: 'VALUE',
                    operandEnvSteps: [{ kind: 'guard' }, { kind: 'number' }],
                    operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
                    predicate: { kind: 'eq', literal: 5 },
                  },
                  startLine: 2,
                  endLine: 2,
                },
              ],
              exits: [],
              cases: [],
            }),
          ],
        }),
      });

      expect(gatherEnvReadsTransformer({ blobs: [blob] })).toStrictEqual([
        { property: 'VALUE', literals: [5], readers: ['src/guarded.ts'] },
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
