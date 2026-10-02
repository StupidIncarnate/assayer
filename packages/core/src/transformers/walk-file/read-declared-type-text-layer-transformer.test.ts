import { Project } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readDeclaredTypeTextLayerTransformer } from './read-declared-type-text-layer-transformer';
import { readDeclaredTypeTextLayerTransformerProxy } from './read-declared-type-text-layer-transformer.proxy';

const IMPORT = "import type { Db } from './db';\n";

describe('readDeclaredTypeTextLayerTransformer', () => {
  describe('a declaration the checker collapses', () => {
    // The defect this unit exists for: `Db` is imported, so the hermetic walk types it `any` (§5.10),
    // and `any` ABSORBS a union — the checker answers `any` for the whole parameter. An invoice naming
    // `any` names a type the reader cannot find anywhere in their own signature.
    it('VALID: {Db | string, Db imported} => the declared members, never the collapsed any', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', `${IMPORT}export function f(db: Db | string): void {}\n`);
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(param.getType().getText()).toBe('any');
      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe('Db | string');
    });

    it('VALID: {Db & { a: number }, Db imported} => the declared intersection, joined with &', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        `${IMPORT}export function f(db: Db & { a: number }): void {}\n`,
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe('Db & { a: number; }');
    });

    // A union member the checker DOES resolve is rendered by the checker, so the two halves of one
    // rendering come from the same authority rather than one being read off the source.
    it('VALID: {string | Db | number} => every member in declaration order', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        `${IMPORT}export function f(db: string | Db | number): void {}\n`,
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe('string | Db | number');
    });
  });

  describe('a declaration the checker renders itself', () => {
    it('VALID: {a bare imported reference} => the name the checker keeps for it', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', `${IMPORT}export function f(db: Db): void {}\n`);
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe('Db');
    });

    it('VALID: {a primitive keyword} => the checker rendering, unchanged', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: number): void {}\n');
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('n');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe('number');
    });

    it('VALID: {a resolvable literal union} => the checker rendering of each member', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "export function f(mode: 'a' | 'b'): void {}\n");
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('mode');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe('"a" | "b"');
    });

    // A type REFERENCE renders as its OWN name plus its arguments, never the checker's module-qualified
    // rendering of what it resolves to — the reader can find `Box<Db>` in their own file, never
    // `import("/abs/path/box").Box<number>`.
    it('VALID: {a generic type reference} => the name plus its arguments, recursed', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        `${IMPORT}export function f(box: Box<Db>): void {}\ninterface Box<T> { value: T }\n`,
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('box');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe('Box<Db>');
    });
  });

  describe('grouping', () => {
    // Parentheses are grouping, never meaning: a spelling difference must not become a rendering
    // difference, which is the same rule that keeps a coverage ID still under reformatting (§5.1).
    it('VALID: {redundant parens around a member} => the same bytes as without them', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        `${IMPORT}export function f(a: (Db) | string, b: Db|string): void {}\n`,
      );
      const fn = sourceFile.getFunctionOrThrow('f');

      expect(readDeclaredTypeTextLayerTransformer({ node: fn.getParameterOrThrow('a').getTypeNodeOrThrow() })).toBe(
        readDeclaredTypeTextLayerTransformer({ node: fn.getParameterOrThrow('b').getTypeNodeOrThrow() }),
      );
    });

    // A function type binds looser than `|`, so dropping its parens would turn a union member into a
    // function RETURNING the union — a different type, stated to the reader as if it were theirs.
    it('VALID: {a function type in a union} => kept parenthesized', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        `${IMPORT}export function f(cb: ((n: number) => void) | Db): void {}\n`,
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('cb');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe(
        '((n: number) => void) | Db',
      );
    });

    it('VALID: {a union inside an intersection} => kept parenthesized', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        `${IMPORT}export function f(db: (Db | string) & { a: number }): void {}\n`,
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe(
        '(Db | string) & { a: number; }',
      );
    });

    // The mirror of the case above: an INTERSECTION nested inside a union is the OTHER operand of the
    // same `isFunctionTypeNode || isConstructorTypeNode || isUnionTypeNode || isIntersectionTypeNode`
    // grouping check — a case union-inside-intersection alone leaves entirely untested.
    it('VALID: {an intersection inside a union} => kept parenthesized', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        `${IMPORT}export function f(db: (Db & string) | number): void {}\n`,
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('db');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe(
        '(Db & string) | number',
      );
    });

    it('VALID: {a constructor type in a union} => kept parenthesized', () => {
      readDeclaredTypeTextLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        `${IMPORT}export function f(make: (new (n: number) => Db) | string): void {}\n`,
      );
      const param = sourceFile.getFunctionOrThrow('f').getParameterOrThrow('make');

      expect(readDeclaredTypeTextLayerTransformer({ node: param.getTypeNodeOrThrow() })).toBe(
        '(new (n: number) => Db) | string',
      );
    });
  });
});
