import { CompiledFileBlobStub, FileAnalysisStub, ResolvedEdgeStub, ResolvedIndexStub } from '@assayer/shared/contracts';

import { gatherPropertyGuardsTransformer } from './gather-property-guards-transformer';

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
    declaredTypes: [{ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] }],
    functions: [],
  }),
});

const crossFileReader = CompiledFileBlobStub({
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

const crossFileIndex = ResolvedIndexStub({
  edges: [ResolvedEdgeStub({ from: 'src/a/reader-a.ts', specifier: '../types/types', importedName: 'Config', target: { kind: 'local', relPath: 'src/types/types.ts' } })],
});

describe('gatherPropertyGuardsTransformer', () => {
  describe('a same-file object-member branch', () => {
    it("VALID: {Config declared, config.mode === 'a' read in the same file} => one guard keyed on the type, at reader:line", () => {
      const result = gatherPropertyGuardsTransformer({ blobs: [blobReadingConfigMode], resolvedIndex: EMPTY_INDEX });

      expect(result).toStrictEqual([
        {
          key: 'src/config/config.ts#Config',
          property: 'mode',
          reader: 'src/config/config.ts',
          line: 6,
          predicate: { kind: 'eq', literal: 'a' },
          operandType: { kind: 'string' },
        },
      ]);
    });
  });

  describe('a cross-file object-member branch resolved through the local edge', () => {
    it("VALID: {Config in types.ts, reader-a reads config.mode === 'a'} => one guard keyed on types.ts, at the reader:line", () => {
      const result = gatherPropertyGuardsTransformer({ blobs: [typesBlob, crossFileReader], resolvedIndex: crossFileIndex });

      expect(result).toStrictEqual([
        {
          key: 'src/types/types.ts#Config',
          property: 'mode',
          reader: 'src/a/reader-a.ts',
          line: 4,
          predicate: { kind: 'eq', literal: 'a' },
          operandType: { kind: 'unknown', text: 'any' },
        },
      ]);
    });
  });

  describe('a scalar branch that reads no object member', () => {
    it('EMPTY: {if (value > 5), no operandTypeRef} => no guards', () => {
      const blob = CompiledFileBlobStub({
        relPath: 'src/grade/grade.ts',
        analysis: FileAnalysisStub({
          declaredTypes: [],
          functions: [
            {
              entry: { name: 'grade', scopePath: ['*module*', 'grade'], params: [{ name: 'value', type: { kind: 'number' } }], returnType: { kind: 'string' }, line: 1, access: { kind: 'named' } },
              branches: [
                {
                  coverageId: 'grade/if:value>5',
                  kind: 'if',
                  condition: { kind: 'leaf', id: 'grade/if:value>5#leaf', operandParamName: 'value', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } },
                  startLine: 2,
                  endLine: 4,
                },
              ],
              exits: [{ coverageId: 'grade/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'grade/if:value>5', arm: 'then' }], line: 3 }],
              cases: [],
            },
          ],
        }),
      });

      const result = gatherPropertyGuardsTransformer({ blobs: [blob], resolvedIndex: EMPTY_INDEX });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a nested object-member read', () => {
    it('EMPTY: {config.user.role — a two-level path} => no guard (a later rung)', () => {
      const blob = CompiledFileBlobStub({
        relPath: 'src/nested/nested.ts',
        analysis: FileAnalysisStub({
          declaredTypes: [{ name: 'Config', properties: [{ name: 'user', type: { kind: 'object', typeName: 'User', properties: [{ name: 'role', type: { kind: 'string' } }] } }] }],
          functions: [
            {
              entry: { name: 'decide', scopePath: ['*module*', 'decide'], params: [{ name: 'config', type: { kind: 'object', typeName: 'Config', properties: [{ name: 'user', type: { kind: 'object', typeName: 'User', properties: [{ name: 'role', type: { kind: 'string' } }] } }] } }], returnType: { kind: 'string' }, line: 1, access: { kind: 'named' } },
              branches: [
                {
                  coverageId: 'decide/if:config.user.role===admin',
                  kind: 'if',
                  condition: { kind: 'leaf', id: 'decide/if:config.user.role===admin#leaf', operandParamName: 'config', operandPropertyPath: ['user', 'role'], operandTypeRef: 'Config', operandType: { kind: 'string' }, predicate: { kind: 'eq', literal: 'admin' } },
                  startLine: 2,
                  endLine: 4,
                },
              ],
              exits: [{ coverageId: 'decide/return@then', kind: 'return', guardPath: [{ branchCoverageId: 'decide/if:config.user.role===admin', arm: 'then' }], line: 3 }],
              cases: [],
            },
          ],
        }),
      });

      const result = gatherPropertyGuardsTransformer({ blobs: [blob], resolvedIndex: EMPTY_INDEX });

      expect(result).toStrictEqual([]);
    });
  });

  describe('an object-member read of a type no blob declares', () => {
    it('EMPTY: {operandTypeRef Config, but no blob declares Config} => no guard (unresolvable, not spurious)', () => {
      const result = gatherPropertyGuardsTransformer({ blobs: [crossFileReader], resolvedIndex: EMPTY_INDEX });

      expect(result).toStrictEqual([]);
    });
  });
});
