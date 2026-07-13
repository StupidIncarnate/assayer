import { gutterMarkerContract } from './gutter-marker-contract';
import { GutterMarkerStub } from './gutter-marker.stub';

describe('gutterMarkerContract', () => {
  describe('valid markers', () => {
    it('VALID: {line: 3, count: 1} => parses to a branded marker', () => {
      const result = gutterMarkerContract.parse({ line: 3, count: 1 });

      expect(result).toStrictEqual({ line: 3, count: 1 });
    });

    it('VALID: {value: stub default} => parses to line 2 count 2', () => {
      const marker = GutterMarkerStub();

      expect(marker).toStrictEqual({ line: 2, count: 2 });
    });
  });

  describe('invalid markers', () => {
    it('INVALID: {count: 0} => throws validation error (count must be positive)', () => {
      expect(() => {
        return gutterMarkerContract.parse({ line: 2, count: 0 });
      }).toThrow(/./u);
    });

    it('INVALID: {line: 0} => throws validation error (line must be positive)', () => {
      expect(() => {
        return gutterMarkerContract.parse({ line: 0, count: 1 });
      }).toThrow(/./u);
    });
  });
});
