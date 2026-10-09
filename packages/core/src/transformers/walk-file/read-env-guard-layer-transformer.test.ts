import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import type { Node } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readEnvGuardLayerTransformer } from './read-env-guard-layer-transformer';
import { readEnvGuardLayerTransformerProxy } from './read-env-guard-layer-transformer.proxy';

// The initializer of the file's `subject` const, parsed exactly as the walk parses.
const initializerOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);

  return sourceFile.getVariableDeclarationOrThrow('subject').getInitializerOrThrow();
};

describe('readEnvGuardLayerTransformer', () => {
  describe('the guard shape', () => {
    it('VALID: {x === undefined ? undefined : arm} => the compared expression and the arm', () => {
      readEnvGuardLayerTransformerProxy();
      const node = initializerOf({
        source: 'const subject = process.env.V === undefined ? undefined : Number(process.env.V);',
      }).asKindOrThrow(SyntaxKind.ConditionalExpression);

      const result = readEnvGuardLayerTransformer({ node });

      expect(result).toStrictEqual({
        tested: node.getCondition().asKindOrThrow(SyntaxKind.BinaryExpression).getLeft(),
        setArm: node.getWhenFalse(),
      });
    });

    it('VALID: {x !== undefined ? arm : undefined} => the arms swapped', () => {
      readEnvGuardLayerTransformerProxy();
      const node = initializerOf({
        source: "const subject = process.env.V !== undefined ? process.env.V === 'on' : undefined;",
      }).asKindOrThrow(SyntaxKind.ConditionalExpression);

      const result = readEnvGuardLayerTransformer({ node });

      expect(result).toStrictEqual({
        tested: node.getCondition().asKindOrThrow(SyntaxKind.BinaryExpression).getLeft(),
        setArm: node.getWhenTrue(),
      });
    });

    it('VALID: {(undefined === x) ? (undefined) : arm} => undefined on the left and parentheses read through', () => {
      readEnvGuardLayerTransformerProxy();
      const node = initializerOf({
        source: 'const subject = (undefined === process.env.V) ? (undefined) : process.env.V;',
      }).asKindOrThrow(SyntaxKind.ConditionalExpression);

      const result = readEnvGuardLayerTransformer({ node });

      expect(result).toStrictEqual({
        tested: node
          .getCondition()
          .asKindOrThrow(SyntaxKind.ParenthesizedExpression)
          .getExpression()
          .asKindOrThrow(SyntaxKind.BinaryExpression)
          .getRight(),
        setArm: node.getWhenFalse(),
      });
    });
  });

  describe('anything else', () => {
    it('EMPTY: {not a ternary} => undefined', () => {
      readEnvGuardLayerTransformerProxy();

      expect(readEnvGuardLayerTransformer({ node: initializerOf({ source: 'const subject = process.env.V;' }) })).toBe(undefined);
    });

    it('INVALID: {a condition that is not a comparison} => undefined', () => {
      readEnvGuardLayerTransformerProxy();

      const result = readEnvGuardLayerTransformer({
        node: initializerOf({ source: 'const subject = process.env.V ? undefined : Number(process.env.V);' }),
      });

      expect(result).toBe(undefined);
    });

    it('INVALID: {a loose == undefined} => undefined, since it is also true for null', () => {
      readEnvGuardLayerTransformerProxy();

      const result = readEnvGuardLayerTransformer({
        node: initializerOf({ source: 'const subject = process.env.V == undefined ? undefined : Number(process.env.V);' }),
      });

      expect(result).toBe(undefined);
    });

    it('INVALID: {a comparison with null} => undefined', () => {
      readEnvGuardLayerTransformerProxy();

      const result = readEnvGuardLayerTransformer({
        node: initializerOf({ source: 'const subject = process.env.V === null ? undefined : Number(process.env.V);' }),
      });

      expect(result).toBe(undefined);
    });

    it('INVALID: {an unset arm that is not undefined} => undefined', () => {
      readEnvGuardLayerTransformerProxy();

      const result = readEnvGuardLayerTransformer({
        node: initializerOf({ source: 'const subject = process.env.V === undefined ? 0 : Number(process.env.V);' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
