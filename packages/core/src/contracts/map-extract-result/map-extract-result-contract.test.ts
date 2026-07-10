import { MapNodeStub } from '@assayer/shared/contracts';

import { mapExtractResultContract } from './map-extract-result-contract';
import { MapExtractResultStub } from './map-extract-result.stub';

describe('mapExtractResultContract', () => {
  describe('valid map extract results', () => {
    it('VALID: {success: true, nodes: []} => parses success with empty nodes', () => {
      const result = mapExtractResultContract.parse(MapExtractResultStub());

      expect(result).toStrictEqual({ success: true, nodes: [] });
    });

    it('VALID: {success: true, nodes: [functionNode]} => parses success with one node', () => {
      const node = MapNodeStub({ kind: 'function', startLine: 1, endLine: 5 });

      const result = mapExtractResultContract.parse({ success: true, nodes: [node] });

      expect(result).toStrictEqual({ success: true, nodes: [node] });
    });

    it('VALID: {success: false, error} => parses failure with positioned error', () => {
      const result = mapExtractResultContract.parse({
        success: false,
        error: { line: 2, column: 4, message: 'Unexpected token' },
      });

      expect(result).toStrictEqual({
        success: false,
        error: { line: 2, column: 4, message: 'Unexpected token' },
      });
    });
  });

  describe('invalid map extract results', () => {
    it('INVALID: {success: false, error: missing message} => throws validation error', () => {
      expect(() => {
        return mapExtractResultContract.parse({ success: false, error: { line: 2, column: 4 } });
      }).toThrow(/./u);
    });
  });
});
