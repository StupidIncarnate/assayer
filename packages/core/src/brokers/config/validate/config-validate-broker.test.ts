import { configValidateBroker } from './config-validate-broker';
import { configValidateBrokerProxy } from './config-validate-broker.proxy';

describe('configValidateBroker', () => {
  describe('valid config', () => {
    it('VALID: {config: version, repoRoot, exclude} => returns success:true with the validated config', () => {
      configValidateBrokerProxy();

      const result = configValidateBroker({
        config: { version: '1', repoRoot: '.', exclude: [], darkSpots: 'warn' },
      });

      expect(result).toStrictEqual({
        success: true,
        config: { version: '1', repoRoot: '.', exclude: [], darkSpots: 'warn', deadSurface: 'error', runMode: 'thorough' },
      });
    });
  });

  describe('invalid config', () => {
    it('INVALID: {config: {repoRoot: 123}} => returns success:false with a single repoRoot issue', () => {
      configValidateBrokerProxy();

      const result = configValidateBroker({
        config: { version: '1', repoRoot: 123, exclude: [], darkSpots: 'warn' },
      });

      expect(result).toStrictEqual({
        success: false,
        issues: [{ path: 'repoRoot', message: 'Expected string, received number' }],
      });
    });
  });
});
