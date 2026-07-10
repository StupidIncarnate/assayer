import { AssayerConfigStub } from '@assayer/shared/contracts';

import { configHashBroker } from './config-hash-broker';
import { configHashBrokerProxy } from './config-hash-broker.proxy';

describe('configHashBroker', () => {
  describe('deterministic hashing', () => {
    it('VALID: {config} called twice => returns the identical hash both times', () => {
      configHashBrokerProxy();
      const config = AssayerConfigStub();

      const result1 = configHashBroker({ config });
      const result2 = configHashBroker({ config });

      expect(result1).toBe(result2);
    });

    it('VALID: {exclude: ["b","a"]} vs {exclude: ["a","b"]} => returns the identical hash', () => {
      configHashBrokerProxy();
      const configOrderOne = AssayerConfigStub({ exclude: ['b', 'a'] });
      const configOrderTwo = AssayerConfigStub({ exclude: ['a', 'b'] });

      const result1 = configHashBroker({ config: configOrderOne });
      const result2 = configHashBroker({ config: configOrderTwo });

      expect(result1).toBe(result2);
    });
  });
});
