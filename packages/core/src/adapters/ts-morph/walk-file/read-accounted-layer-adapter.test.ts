import { Project, SyntaxKind } from 'ts-morph';

import { readAccountedLayerAdapter } from './read-accounted-layer-adapter';
import { readAccountedLayerAdapterProxy } from './read-accounted-layer-adapter.proxy';

describe('readAccountedLayerAdapter', () => {
  describe('anything that always exits is accounted for', () => {
    it('VALID: {return statement} => true', () => {
      readAccountedLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): number {\n  return 1;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      expect(readAccountedLayerAdapter({ node })).toBe(true);
    });

    it('VALID: {block whose last statement returns} => true', () => {
      readAccountedLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): number {\n  const q = 1;\n  return q;\n}\n');
      const node = sourceFile.getFunctionOrThrow('f').getBodyOrThrow();

      expect(readAccountedLayerAdapter({ node })).toBe(true);
    });
  });

  describe('arms that fall through are accounted for anyway, because each gets a completion exit', () => {
    // This is the ONLY difference from read-terminal, and the reason both exist: in tail position
    // each arm of an if-with-else gets a synthesized completion exit, so the scope owes none —
    // even though the if does not "always exit" and therefore guards nothing after it.
    it('VALID: {if with an else whose arms merely fall off the end} => true', () => {
      readAccountedLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const x: boolean;\ndeclare function noop(): void;\nfunction f(): void {\n  if (x) {\n    noop();\n  } else {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(readAccountedLayerAdapter({ node })).toBe(true);
    });

    it('VALID: {switch with a default whose case merely breaks} => true', () => {
      readAccountedLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const m: string;\ndeclare function noop(): void;\nfunction f(): void {\n  switch (m) {\n    case "a":\n      break;\n    default:\n      noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      expect(readAccountedLayerAdapter({ node })).toBe(true);
    });

    it('VALID: {block ending in a fall-through if/else} => true, deferring to its last statement', () => {
      readAccountedLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const x: boolean;\ndeclare function noop(): void;\nfunction f(): void {\n  if (x) {\n    noop();\n  } else {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFunctionOrThrow('f').getBodyOrThrow();

      expect(readAccountedLayerAdapter({ node })).toBe(true);
    });
  });

  describe('an unwritten path is NOT accounted for', () => {
    it('VALID: {if without an else} => false, because the else path falls through unrecorded', () => {
      readAccountedLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const x: boolean;\ndeclare function noop(): void;\nfunction f(): void {\n  if (x) {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(readAccountedLayerAdapter({ node })).toBe(false);
    });

    it('VALID: {switch without a default} => false, because an unmatched discriminant falls through', () => {
      readAccountedLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const m: string;\nfunction f(): void {\n  switch (m) {\n    case "a":\n      break;\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      expect(readAccountedLayerAdapter({ node })).toBe(false);
    });

    it('VALID: {expression statement} => false, since running it records no exit', () => {
      readAccountedLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function noop(): void;\nfunction f(): void {\n  noop();\n}\n',
      );
      const node = sourceFile.getFunctionOrThrow('f').getStatements().at(-1);

      expect(readAccountedLayerAdapter({ node })).toBe(false);
    });

    it('EMPTY: {no node} => false', () => {
      readAccountedLayerAdapterProxy();

      expect(readAccountedLayerAdapter({ node: undefined })).toBe(false);
    });
  });
});
