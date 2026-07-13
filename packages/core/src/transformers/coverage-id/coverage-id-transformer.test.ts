import { coverageIdTransformer } from './coverage-id-transformer';

describe('coverageIdTransformer', () => {
  describe('valid coverage ids', () => {
    it('VALID: {scope, branch segment} => joins with a slash', () => {
      expect(coverageIdTransformer({ scope: 'formatGreeting', segment: 'if:name.length===0' })).toBe(
        'formatGreeting/if:name.length===0',
      );
    });

    it('VALID: {scope, exit segment} => joins an exit guard segment', () => {
      expect(coverageIdTransformer({ scope: 'run', segment: 'exit@implicit' })).toBe('run/exit@implicit');
    });
  });
});
