import { DocsTopicStub } from '@assayer/shared/contracts';

import { docsGetBroker } from './docs-get-broker';
import { docsGetBrokerProxy } from './docs-get-broker.proxy';

describe('docsGetBroker', () => {
  describe('known topics', () => {
    it('VALID: {topic: "overview"} => returns the overview documentation body', () => {
      docsGetBrokerProxy();
      const topic = DocsTopicStub({ value: 'overview' });

      const result = docsGetBroker({ topic });

      expect(result).toStrictEqual({
        topic: 'overview',
        body: 'Assayer statically identifies what should be tested, generates and runs the tests itself, and fails like a build error when something testable is uncovered or broken.',
      });
    });
  });

  describe('unknown topics', () => {
    it('ERROR: {topic: "nope"} => throws naming the available topics', () => {
      docsGetBrokerProxy();
      const topic = DocsTopicStub({ value: 'nope' });

      expect(() => {
        return docsGetBroker({ topic });
      }).toThrow(/Unknown docs topic "nope"\. Available topics: overview, plugins\./u);
    });
  });
});
