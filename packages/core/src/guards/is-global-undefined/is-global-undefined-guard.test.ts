import { Project } from '#gateway/npm/ts-morph';
import type { Node } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { isGlobalUndefinedGuard } from './is-global-undefined-guard';

// The initializer of the file's `subject` const, parsed exactly as the walk parses: an in-memory
// project with the standard library and nothing else.
const initializerOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);

  return sourceFile.getVariableDeclarationOrThrow('subject').getInitializerOrThrow();
};

describe('isGlobalUndefinedGuard', () => {
  describe('the global undefined', () => {
    it('VALID: {undefined} => true', () => {
      expect(isGlobalUndefinedGuard({ node: initializerOf({ source: 'const subject = undefined;' }) })).toBe(true);
    });
  });

  describe('anything else', () => {
    it('INVALID: {a local binding named undefined} => false, since the name is not the global', () => {
      const node = initializerOf({ source: 'const undefined = 1;\nconst subject = undefined;' });

      expect(isGlobalUndefinedGuard({ node })).toBe(false);
    });

    it('INVALID: {null} => false, since null is a different value', () => {
      expect(isGlobalUndefinedGuard({ node: initializerOf({ source: 'const subject = null;' }) })).toBe(false);
    });

    it('INVALID: {another identifier} => false', () => {
      expect(isGlobalUndefinedGuard({ node: initializerOf({ source: 'const other = 1;\nconst subject = other;' }) })).toBe(false);
    });

    it('INVALID: {void 0} => false, since only the identifier is read', () => {
      expect(isGlobalUndefinedGuard({ node: initializerOf({ source: 'const subject = void 0;' }) })).toBe(false);
    });

    it('EMPTY: {node: undefined} => false', () => {
      expect(isGlobalUndefinedGuard({})).toBe(false);
    });
  });
});
