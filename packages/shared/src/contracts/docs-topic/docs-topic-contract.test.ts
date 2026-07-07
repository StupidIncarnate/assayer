import { docsTopicContract } from './docs-topic-contract';
import { DocsTopicStub } from './docs-topic.stub';

describe('docsTopicContract', () => {
  describe('valid topics', () => {
    it('VALID: {value: "overview"} => parses successfully', () => {
      const topic = DocsTopicStub({ value: 'overview' });

      const result = docsTopicContract.parse(topic);

      expect(result).toBe('overview');
    });

    it('VALID: {value: "plugins"} => parses successfully', () => {
      const result = docsTopicContract.parse('plugins');

      expect(result).toBe('plugins');
    });
  });

  describe('invalid topics', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return docsTopicContract.parse('');
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => {
        return docsTopicContract.parse(123);
      }).toThrow(/Expected string/u);
    });
  });
});
