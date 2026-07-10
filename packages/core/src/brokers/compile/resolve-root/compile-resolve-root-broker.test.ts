import { compileResolveRootBroker } from './compile-resolve-root-broker';
import { compileResolveRootBrokerProxy } from './compile-resolve-root-broker.proxy';

describe('compileResolveRootBroker', () => {
  describe('resolving repo root against config dir', () => {
    it('VALID: {repoRoot: "./smoke-repo", configDir: "/repo"} => returns "/repo/smoke-repo"', () => {
      compileResolveRootBrokerProxy();

      const result = compileResolveRootBroker({ repoRoot: './smoke-repo', configDir: '/repo' });

      expect(result).toBe('/repo/smoke-repo');
    });

    it('VALID: {repoRoot: ".", configDir: "/repo"} => returns "/repo"', () => {
      compileResolveRootBrokerProxy();

      const result = compileResolveRootBroker({ repoRoot: '.', configDir: '/repo' });

      expect(result).toBe('/repo');
    });
  });
});
