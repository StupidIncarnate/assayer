import { SymbolNameStub } from '@assayer/shared/contracts';

import { coverageIdTransformer } from './coverage-id-transformer';

describe('coverageIdTransformer', () => {
  describe('valid coverage ids', () => {
    it('VALID: {single-segment path, branch segment} => joins with a slash', () => {
      const scopePath = [SymbolNameStub({ value: 'formatGreeting' })];

      expect(coverageIdTransformer({ scopePath, segment: 'if:id:name' })).toBe('formatGreeting/if:id:name');
    });

    it('VALID: {single-segment path, exit segment} => joins an exit guard segment', () => {
      const scopePath = [SymbolNameStub({ value: 'run' })];

      expect(coverageIdTransformer({ scopePath, segment: 'exit@top' })).toBe('run/exit@top');
    });

    it('VALID: {nested path} => joins every segment, so two entries named alike cannot collide', () => {
      const scopePath = [SymbolNameStub({ value: 'Classifier' }), SymbolNameStub({ value: 'classify' })];

      expect(coverageIdTransformer({ scopePath, segment: 'if:id:value' })).toBe('Classifier/classify/if:id:value');
    });

    it('EMPTY: {empty path} => the segment alone', () => {
      expect(coverageIdTransformer({ scopePath: [], segment: 'exit@top' })).toBe('exit@top');
    });
  });
});
