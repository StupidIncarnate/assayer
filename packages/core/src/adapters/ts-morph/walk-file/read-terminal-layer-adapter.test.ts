import { Project, SyntaxKind } from 'ts-morph';

import { readTerminalLayerAdapter } from './read-terminal-layer-adapter';
import { readTerminalLayerAdapterProxy } from './read-terminal-layer-adapter.proxy';

describe('readTerminalLayerAdapter', () => {
  describe('explicit exits', () => {
    it('VALID: {return statement} => true', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): number {\n  return 1;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(true);
    });

    it('VALID: {throw statement} => true', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): number {\n  throw new Error("nope");\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ThrowStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(true);
    });
  });

  describe('blocks defer to their last statement', () => {
    it('VALID: {block whose last statement returns} => true', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): number {\n  const q = 1;\n  return q;\n}\n');
      const node = sourceFile.getFunctionOrThrow('f').getBodyOrThrow();

      expect(readTerminalLayerAdapter({ node })).toBe(true);
    });

    it('VALID: {block whose last statement does not exit} => false', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {\n  const q = 1;\n}\n');
      const node = sourceFile.getFunctionOrThrow('f').getBodyOrThrow();

      expect(readTerminalLayerAdapter({ node })).toBe(false);
    });

    it('EMPTY: {empty block} => false, since it has no last statement to defer to', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {\n  {\n  }\n}\n');
      const node = sourceFile.getFunctionOrThrow('f').getStatements().at(-1);

      expect(readTerminalLayerAdapter({ node })).toBe(false);
    });
  });

  describe('an if is terminal only when BOTH arms exit', () => {
    it('VALID: {if with an else, both arms returning} => true', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const x: boolean;\nfunction f(): number {\n  if (x) {\n    return 1;\n  } else {\n    return 2;\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(true);
    });

    it('VALID: {if without an else} => false, because the unwritten else path falls through', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const x: boolean;\nfunction f(): number {\n  if (x) {\n    return 1;\n  }\n  return 0;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(false);
    });

    // The distinction that makes this a separate predicate from `read-accounted`: code AFTER this
    // if runs on BOTH arms, so the if does not guard it. Calling this terminal would guard the
    // next statement by an arm it does not depend on.
    it('VALID: {if with an else whose arms merely fall off the end} => false', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const x: boolean;\ndeclare function noop(): void;\nfunction f(): void {\n  if (x) {\n    noop();\n  } else {\n    noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(false);
    });

    it('VALID: {if with an else where only the then returns} => false', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const x: boolean;\ndeclare function noop(): void;\nfunction f(): number {\n  if (x) {\n    return 1;\n  } else {\n    noop();\n  }\n  return 0;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(false);
    });
  });

  describe('a switch is terminal only when it has a default AND every clause exits', () => {
    it('VALID: {switch with a default, every clause returning} => true', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const m: string;\nfunction f(): number {\n  switch (m) {\n    case "a":\n      return 1;\n    default:\n      return 2;\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(true);
    });

    it('VALID: {switch without a default} => false, because an unmatched discriminant falls through', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const m: string;\nfunction f(): number {\n  switch (m) {\n    case "a":\n      return 1;\n  }\n  return 0;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(false);
    });

    // Same distinction as the if: a clause that `break`s falls out of the switch and keeps going,
    // so code after the switch is not guarded by any clause.
    it('VALID: {switch with a default whose case merely breaks} => false', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const m: string;\ndeclare function noop(): void;\nfunction f(): void {\n  switch (m) {\n    case "a":\n      break;\n    default:\n      noop();\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      expect(readTerminalLayerAdapter({ node })).toBe(false);
    });
  });

  describe('everything else falls through', () => {
    it('EMPTY: {no node} => false', () => {
      readTerminalLayerAdapterProxy();

      expect(readTerminalLayerAdapter({ node: undefined })).toBe(false);
    });

    it('VALID: {expression statement} => false, since running it does not end the scope', () => {
      readTerminalLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare function noop(): void;\nfunction f(): void {\n  noop();\n}\n');
      const node = sourceFile.getFunctionOrThrow('f').getStatements().at(-1);

      expect(readTerminalLayerAdapter({ node })).toBe(false);
    });
  });
});
