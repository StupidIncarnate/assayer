import { BranchNodeStub, EntrySignatureStub } from '@assayer/shared/contracts';

import { ExtractedFunctionStub } from '../../contracts/extracted-function/extracted-function.stub';
import { fileEnrichmentTransformer } from './file-enrichment-transformer';

describe('fileEnrichmentTransformer', () => {
  describe("an entry's params", () => {
    it('VALID: {two params} => one row per param on the entry line', () => {
      const result = fileEnrichmentTransformer({
        functions: [
          ExtractedFunctionStub({
            entry: EntrySignatureStub({
              line: 3,
              params: [
                { name: 'a', type: { kind: 'number' } },
                { name: 'b', type: { kind: 'string' } },
              ],
            }),
            branches: [],
          }),
        ],
      });

      expect(result).toStrictEqual([
        { line: 3, symbol: 'a', typeText: 'number' },
        { line: 3, symbol: 'b', typeText: 'string' },
      ]);
    });
  });

  describe('a branch leaf over a param operand', () => {
    it('VALID: {if (score > 5)} => the branch-line row with the operand type and its representative range', () => {
      const result = fileEnrichmentTransformer({
        functions: [
          ExtractedFunctionStub({
            entry: EntrySignatureStub({ params: [] }),
            branches: [
              BranchNodeStub({
                startLine: 2,
                condition: {
                  kind: 'leaf',
                  id: 'grade/if:score>5#leaf',
                  operandParamName: 'score',
                  operandType: { kind: 'number' },
                  predicate: { kind: 'gt', literal: 5 },
                },
              }),
            ],
          }),
        ],
      });

      expect(result).toStrictEqual([{ line: 2, symbol: 'score', typeText: 'number', range: [6, 5] }]);
    });
  });

  describe('a branch leaf whose operand is not a simple param', () => {
    it('VALID: {truthy call-guard, no operandParamName} => the leaf is skipped, so no row', () => {
      const result = fileEnrichmentTransformer({
        functions: [
          ExtractedFunctionStub({
            entry: EntrySignatureStub({ params: [] }),
            branches: [
              BranchNodeStub({
                startLine: 2,
                condition: {
                  kind: 'leaf',
                  id: 'grade/if:call#leaf',
                  operandCallPosition: { line: 6, column: 7 },
                  operandType: { kind: 'boolean' },
                  predicate: { kind: 'truthy' },
                },
              }),
            ],
          }),
        ],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a compound && condition', () => {
    it('VALID: {if (score > 5 && bonus > 1)} => one row per leaf, both on the branch line', () => {
      const result = fileEnrichmentTransformer({
        functions: [
          ExtractedFunctionStub({
            entry: EntrySignatureStub({ params: [] }),
            branches: [
              BranchNodeStub({
                startLine: 4,
                condition: {
                  kind: 'and',
                  left: {
                    kind: 'leaf',
                    id: 'grade/if:and#leaf.0',
                    operandParamName: 'score',
                    operandType: { kind: 'number' },
                    predicate: { kind: 'gt', literal: 5 },
                  },
                  right: {
                    kind: 'leaf',
                    id: 'grade/if:and#leaf.1',
                    operandParamName: 'bonus',
                    operandType: { kind: 'number' },
                    predicate: { kind: 'gt', literal: 1 },
                  },
                },
              }),
            ],
          }),
        ],
      });

      expect(result).toStrictEqual([
        { line: 4, symbol: 'score', typeText: 'number', range: [6, 5] },
        { line: 4, symbol: 'bonus', typeText: 'number', range: [2, 1] },
      ]);
    });
  });
});
