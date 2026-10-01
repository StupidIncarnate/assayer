import { Project } from '#gateway/npm/ts-morph';

import { TypeFactStub } from '../../contracts/type-fact/type-fact.stub';
import { readHarnessValueTypeLayerTransformer } from './read-harness-value-type-layer-transformer';
import { readHarnessValueTypeLayerTransformerProxy } from './read-harness-value-type-layer-transformer.proxy';

describe('readHarnessValueTypeLayerAdapter', () => {
  describe('primitive types', () => {
    it('VALID: {a string-typed expression} => string fact', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "const x: string = 'a';\n");
      const type = sourceFile.getVariableDeclarationOrThrow('x').getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'string' }));
    });

    it('VALID: {a number-typed expression} => number fact', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const x: number = 7;\n');
      const type = sourceFile.getVariableDeclarationOrThrow('x').getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'number' }));
    });

    it('VALID: {a boolean-typed expression} => boolean fact', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const x: boolean = true;\n');
      const type = sourceFile.getVariableDeclarationOrThrow('x').getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'boolean' }));
    });
  });

  // The corner the defect is named for: a bare `undefined` expression carries no dedicated flavor, so
  // it falls through to the opaque `other` arm — the same catch-all a `Map<string, number>` reads as.
  describe('undefined', () => {
    it('VALID: {an undefined expression} => other fact carrying the literal text "undefined"', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const x = undefined;\n');
      const type = sourceFile.getVariableDeclarationOrThrow('x').getInitializerOrThrow().getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'other', text: 'undefined' }));
    });
  });

  // A harness's own literal expression reads at its PRECISE literal type, never widened — the property
  // this reader is asked about is unconstrained by any contextual type (`assayerHarness`'s own inputs
  // are `unknown`), so the checker reports exactly what was written.
  describe('literal precision', () => {
    it('VALID: {a string literal expression} => literal fact, not widened to string', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "const x = 'a';\n");
      const type = sourceFile.getVariableDeclarationOrThrow('x').getInitializerOrThrow().getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(TypeFactStub({ flavor: 'literal', value: 'a' }));
    });
  });

  describe('callable types', () => {
    it('VALID: {an arrow-function expression} => callable fact carrying the rendered signature', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const cb = (message: string): string => message;\n');
      const type = sourceFile.getVariableDeclarationOrThrow('cb').getInitializerOrThrow().getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'callable', text: '(message: string) => string' }),
      );
    });
  });

  describe('array types', () => {
    it('VALID: {an array of arrow functions} => array fact whose element is a callable fact', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const xs = [(message: string): void => {}];\n');
      const type = sourceFile.getVariableDeclarationOrThrow('xs').getInitializerOrThrow().getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({ flavor: 'array', element: { flavor: 'callable', text: '(message: string) => void' } }),
      );
    });
  });

  describe('object types', () => {
    // The checker synthesizes a fresh anonymous type for an object literal EXPRESSION read as a whole,
    // widening its property types in the process — `'x'` reads as `string`, not the literal `'x'` a bare
    // scalar expression would keep. Its internal symbol is named `__object`, stripped the same way
    // `__type` is: neither is a real declared name.
    it('VALID: {an object literal expression} => object fact enumerating its WIDENED properties, keyless', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "const cfg = { host: 'x', retries: 3 };\n");
      const type = sourceFile.getVariableDeclarationOrThrow('cfg').getInitializerOrThrow().getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          properties: [
            { name: 'host', fact: { flavor: 'string' } },
            { name: 'retries', fact: { flavor: 'number' } },
          ],
        }),
      );
    });

    // The mark travels with the truncation, exactly as the walk reader and the external-signature reader
    // both mark it: without it a re-entered type is indistinguishable from one that declares nothing.
    it('VALID: {a self-referential-typed expression} => the recursive property truncates to a MARKED reference-only object', () => {
      readHarnessValueTypeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Tree { value: number; next: Tree }\ndeclare const t: Tree;\n',
      );
      const type = sourceFile.getVariableDeclarationOrThrow('t').getType();

      expect(readHarnessValueTypeLayerTransformer({ type })).toStrictEqual(
        TypeFactStub({
          flavor: 'object',
          typeName: 'Tree',
          properties: [
            { name: 'next', fact: { flavor: 'object', typeName: 'Tree', truncated: true, properties: [] } },
            { name: 'value', fact: { flavor: 'number' } },
          ],
        }),
      );
    });
  });
});
