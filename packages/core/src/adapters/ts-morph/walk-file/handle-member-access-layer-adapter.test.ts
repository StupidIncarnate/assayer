import { Project, SyntaxKind } from 'ts-morph';
import type { PropertyAccessExpression } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleMemberAccessLayerAdapter } from './handle-member-access-layer-adapter';
import { handleMemberAccessLayerAdapterProxy } from './handle-member-access-layer-adapter.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

const accessOf = ({ source }: { source: string }): PropertyAccessExpression =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.PropertyAccessExpression);

describe('handleMemberAccessLayerAdapter', () => {
  describe('the global use it records', () => {
    it('VALID: {console.log(x)} => one called global use carrying the member and the arg shape', () => {
      handleMemberAccessLayerAdapterProxy();

      const result = handleMemberAccessLayerAdapter({ node: accessOf({ source: "console.log('big');\n" }), context: MODULE_CONTEXT });

      expect(result.globalUses).toStrictEqual([
        { name: 'console', member: 'log', called: true, args: [{ kind: 'literal', value: 'big' }], line: 1, column: 1 },
      ]);
    });

    it('VALID: {process.env, a bare member access} => one uncalled global use with no args', () => {
      handleMemberAccessLayerAdapterProxy();

      const result = handleMemberAccessLayerAdapter({ node: accessOf({ source: 'process.env;\n' }), context: MODULE_CONTEXT });

      expect(result.globalUses).toStrictEqual([
        { name: 'process', member: 'env', called: false, args: [], line: 1, column: 1 },
      ]);
    });
  });

  describe('accesses that are not ambient externals', () => {
    it('VALID: {a member access off a local binding} => no global use, just descents', () => {
      handleMemberAccessLayerAdapterProxy();

      const result = handleMemberAccessLayerAdapter({
        node: accessOf({ source: 'const o = { a: 1 };\nexport const b = o.a;\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.globalUses).toStrictEqual([]);
    });
  });

  describe('what it does NOT contribute', () => {
    it('VALID: {a member access} => no branches, exits, calls, or scope of its own, and it descends its children', () => {
      handleMemberAccessLayerAdapterProxy();

      const result = handleMemberAccessLayerAdapter({ node: accessOf({ source: 'process.env;\n' }), context: MODULE_CONTEXT });

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
