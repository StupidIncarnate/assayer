import { runIdBroker } from './run-id-broker';
import { runIdBrokerProxy } from './run-id-broker.proxy';

describe('runIdBroker', () => {
  describe('naming a run', () => {
    // Content-keyed, never a timestamp: the same bytes must name the same run or a detail link goes
    // stale the moment it is printed, and no reader could ever find what the runner wrote.
    it('VALID: {a file} => a deterministic id', () => {
      runIdBrokerProxy();

      const result = runIdBroker({ relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(result)).toBe('c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931');
    });

    it('VALID: {the same file twice} => the same id', () => {
      runIdBrokerProxy();

      const second = runIdBroker({ relPath: 'src/a.ts', source: 'export const a = 1;\n' });

      expect(String(second)).toBe('c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931');
    });

    // Path alone would collide across edits, so a stale run would answer for new code.
    it('VALID: {same path, changed content} => a different id', () => {
      runIdBrokerProxy();

      const after = runIdBroker({ relPath: 'src/a.ts', source: 'export const a = 2;\n' });

      expect(String(after)).toBe('21abc21f1e4c00faaed90374bbfe5551d39a869f701b13e1f3eaaf5803763cad');
    });

    // Content alone would collide across files that happen to read the same.
    it('VALID: {same content, different path} => a different id', () => {
      runIdBrokerProxy();

      const other = runIdBroker({ relPath: 'src/b.ts', source: 'export const a = 1;\n' });

      expect(String(other)).toBe('b2c0c2def6e2bf609d09a2d343d1c6515e0162e6fc7db058e55393f5d745492c');
    });
  });
});
