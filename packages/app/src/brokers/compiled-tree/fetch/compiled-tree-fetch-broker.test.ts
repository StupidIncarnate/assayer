import { compiledTreeFetchBroker } from './compiled-tree-fetch-broker';
import { compiledTreeFetchBrokerProxy } from './compiled-tree-fetch-broker.proxy';
import { CompiledTreeStub } from '@assayer/shared/contracts';

describe('compiledTreeFetchBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {bridge resolves tree} => returns that same CompiledTree', async () => {
      const proxy = compiledTreeFetchBrokerProxy();
      const tree = CompiledTreeStub();
      proxy.setupTree({ tree });

      const result = await compiledTreeFetchBroker();

      expect(result).toStrictEqual(tree);
    });
  });
});
