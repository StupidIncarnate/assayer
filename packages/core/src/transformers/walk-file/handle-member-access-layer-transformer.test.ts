import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import type { PropertyAccessExpression } from '#gateway/npm/ts-morph';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { handleMemberAccessLayerTransformer } from './handle-member-access-layer-transformer';
import { handleMemberAccessLayerTransformerProxy } from './handle-member-access-layer-transformer.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

const accessOf = ({ source }: { source: string }): PropertyAccessExpression =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.PropertyAccessExpression);

describe('handleMemberAccessLayerAdapter', () => {
  describe('the global use it records', () => {
    it('VALID: {console.log(x)} => one called global use carrying the member and the arg shape', () => {
      handleMemberAccessLayerTransformerProxy();

      const result = handleMemberAccessLayerTransformer({ node: accessOf({ source: "console.log('big');\n" }), context: MODULE_CONTEXT });

      expect(result.globalUses).toStrictEqual([
        {
          name: 'console',
          member: 'log',
          called: true,
          args: [{ kind: 'literal', value: 'big' }],
          line: 1,
          column: 1,
          scopePath: ['*module*'],
        },
      ]);
    });

    it('VALID: {process.env, a bare member access} => one uncalled global use with no args', () => {
      handleMemberAccessLayerTransformerProxy();

      const result = handleMemberAccessLayerTransformer({ node: accessOf({ source: 'process.env;\n' }), context: MODULE_CONTEXT });

      expect(result.globalUses).toStrictEqual([
        { name: 'process', member: 'env', called: false, args: [], line: 1, column: 1, scopePath: ['*module*'] },
      ]);
    });

    it('VALID: {console.log(x) inside a function body} => the global use carries the ENCLOSING function`s scope path', () => {
      handleMemberAccessLayerTransformerProxy();
      const FUNCTION_CONTEXT = WalkContextStub({ scopePath: ['*module*', 'report'], guardPath: [], params: [], exported: true });

      const result = handleMemberAccessLayerTransformer({
        node: accessOf({ source: "console.log('big');\n" }),
        context: FUNCTION_CONTEXT,
      });

      expect(result.globalUses).toStrictEqual([
        {
          name: 'console',
          member: 'log',
          called: true,
          args: [{ kind: 'literal', value: 'big' }],
          line: 1,
          column: 1,
          scopePath: ['*module*', 'report'],
        },
      ]);
    });
  });

  describe('the env read it records', () => {
    it("VALID: {process.env.MODE === 'production'} => one env read naming MODE and its compared literal", () => {
      handleMemberAccessLayerTransformerProxy();

      const result = handleMemberAccessLayerTransformer({
        node: accessOf({ source: "if (process.env.MODE === 'production') {\n}\n" }),
        context: MODULE_CONTEXT,
      });

      expect({ envReads: result.envReads, globalUses: result.globalUses }).toStrictEqual({
        envReads: [{ property: 'MODE', literals: ['production'] }],
        globalUses: [],
      });
    });

    it('VALID: {Number(process.env.CODE)} => one env read naming CODE with no literal (not a direct comparison)', () => {
      handleMemberAccessLayerTransformerProxy();

      const result = handleMemberAccessLayerTransformer({
        node: accessOf({ source: 'const code = Number(process.env.CODE);\n' }),
        context: MODULE_CONTEXT,
      });

      expect({ envReads: result.envReads, globalUses: result.globalUses }).toStrictEqual({
        envReads: [{ property: 'CODE', literals: [] }],
        globalUses: [],
      });
    });

    it('VALID: {a bare const m = process.env.MODE} => one env read naming MODE with no literal', () => {
      handleMemberAccessLayerTransformerProxy();

      const result = handleMemberAccessLayerTransformer({
        node: accessOf({ source: 'export const m = process.env.MODE;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.envReads).toStrictEqual([{ property: 'MODE', literals: [] }]);
    });
  });

  describe('accesses that are not ambient externals', () => {
    it('VALID: {a member access off a local binding} => no global use, just descents', () => {
      handleMemberAccessLayerTransformerProxy();

      const result = handleMemberAccessLayerTransformer({
        node: accessOf({ source: 'const o = { a: 1 };\nexport const b = o.a;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.globalUses).toStrictEqual([]);
    });
  });

  describe('what it does NOT contribute', () => {
    it('VALID: {a member access} => no branches, exits, calls, or scope of its own, and it descends its children', () => {
      handleMemberAccessLayerTransformerProxy();

      const result = handleMemberAccessLayerTransformer({ node: accessOf({ source: 'process.env;\n' }), context: MODULE_CONTEXT });

      expect({
        branches: result.branches,
        exits: result.exits,
        calls: result.calls,
        opensScope: result.opensScope,
        descents: result.descents.map((descent) => descent.node.getKindName()),
      }).toStrictEqual({ branches: [], exits: [], calls: [], opensScope: undefined, descents: ['Identifier', 'Identifier'] });
    });
  });
});
