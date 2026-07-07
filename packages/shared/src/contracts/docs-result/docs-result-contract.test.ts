import { docsResultContract } from './docs-result-contract';
import { DocsResultStub } from './docs-result.stub';

describe('docsResultContract', () => {
  describe('valid docs results', () => {
    it('VALID: {topic, body} => parses successfully', () => {
      const docs = DocsResultStub({ topic: 'overview', body: '# Assayer' });

      const result = docsResultContract.parse(docs);

      expect(result).toStrictEqual({ topic: 'overview', body: '# Assayer' });
    });

    it('VALID: {body override} => parses with custom body', () => {
      const docs = DocsResultStub({ body: '# Plugins guide' });

      const result = docsResultContract.parse(docs);

      expect(result.body).toBe('# Plugins guide');
    });
  });

  describe('invalid docs results', () => {
    it('INVALID: {missing body} => throws validation error', () => {
      expect(() => {
        return docsResultContract.parse({ topic: 'overview' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {topic: ""} => throws validation error', () => {
      expect(() => {
        return docsResultContract.parse({ topic: '', body: '# Assayer' });
      }).toThrow(/at least 1 character/u);
    });
  });
});
