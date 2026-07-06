import { reactCreateElementAdapter } from './react-create-element-adapter';
import { reactCreateElementAdapterProxy } from './react-create-element-adapter.proxy';

describe('reactCreateElementAdapter', () => {
  describe('creating an element', () => {
    it('VALID: {component} => returns a react element of the component type', () => {
      reactCreateElementAdapterProxy();
      const component = (): null => null;

      const result = reactCreateElementAdapter({ component });

      expect(result.type).toBe(component);
    });
  });
});
