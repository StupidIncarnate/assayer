import { typescriptLibLocateBroker } from './typescript-lib-locate-broker';
import { typescriptLibLocateBrokerProxy } from './typescript-lib-locate-broker.proxy';

describe('typescriptLibLocateBroker', () => {
  describe('typescript installed', () => {
    it('VALID: {typescript is installed} => returns the lib folder inside the typescript package', () => {
      typescriptLibLocateBrokerProxy();

      const result = typescriptLibLocateBroker();

      expect(result).toMatch(/^\/.+\/typescript\/lib$/u);
    });
  });
});
