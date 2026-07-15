import { moduleScopeStatics } from './module-scope-statics';

describe('moduleScopeStatics', () => {
  describe('name', () => {
    it('VALID: {statics} => holds the bracketed module scope name and its void return text', () => {
      expect(moduleScopeStatics).toStrictEqual({ name: '*module*', returnTypeText: 'void' });
    });

    it('VALID: {name} => is not a legal TypeScript identifier, so it cannot collide with a real one', () => {
      expect(/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(moduleScopeStatics.name)).toBe(false);
    });
  });
});
