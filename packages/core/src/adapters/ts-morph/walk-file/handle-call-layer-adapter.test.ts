import { Project, SyntaxKind } from 'ts-morph';
import type { CallExpression } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleCallLayerAdapter } from './handle-call-layer-adapter';
import { handleCallLayerAdapterProxy } from './handle-call-layer-adapter.proxy';

const PASSTHROUGH_SOURCE =
  'function inner(n: number): string {\n  return "x";\n}\n' +
  'export function outer(value: number): string {\n  return inner(value);\n}\n';

const IIFE_SOURCE = "export const label = ((n: number): string => { if (n > 5) { return 'big'; } return 'small'; })(7);\n";

const GLOBAL_CALL_SOURCE = "setTimeout('tick', 0);\n";

const UNGUARDED_CONTEXT = WalkContextStub({
  scopePath: ['outer'],
  guardPath: [],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
});

const GUARDED_CONTEXT = WalkContextStub({
  scopePath: ['outer'],
  guardPath: [{ branchCoverageId: 'outer/if:id:flag', arm: 'else' }],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
});

const callOf = ({ source }: { source: string }): CallExpression =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression);

describe('handleCallLayerAdapter', () => {
  describe('the call edge it records', () => {
    it('VALID: {a call passing the caller`s param straight in} => a local edge with a param-ref, unguarded', () => {
      handleCallLayerAdapterProxy();

      const result = handleCallLayerAdapter({ node: callOf({ source: PASSTHROUGH_SOURCE }), context: UNGUARDED_CONTEXT });

      expect(result.calls).toStrictEqual([
        {
          callee: { target: 'local', name: 'inner', startLine: 1 },
          args: [{ kind: 'param-ref', paramName: 'value' }],
          guardPath: [],
          position: { line: 5, column: 10 },
        },
      ]);
    });

    it('VALID: {a call reached only through an if arm} => the edge carries that guard', () => {
      handleCallLayerAdapterProxy();

      const result = handleCallLayerAdapter({ node: callOf({ source: PASSTHROUGH_SOURCE }), context: GUARDED_CONTEXT });

      expect(result.calls).toStrictEqual([
        {
          callee: { target: 'local', name: 'inner', startLine: 1 },
          args: [{ kind: 'param-ref', paramName: 'value' }],
          guardPath: [{ branchCoverageId: 'outer/if:id:flag', arm: 'else' }],
          position: { line: 5, column: 10 },
        },
      ]);
    });
  });

  describe('the global use a bare-identifier ambient call records', () => {
    it("VALID: {setTimeout('tick', 0)} => one called global use carrying the caller`s scope path", () => {
      handleCallLayerAdapterProxy();

      const result = handleCallLayerAdapter({ node: callOf({ source: GLOBAL_CALL_SOURCE }), context: UNGUARDED_CONTEXT });

      expect(result.globalUses).toStrictEqual([
        {
          name: 'setTimeout',
          called: true,
          args: [{ kind: 'literal', value: 'tick' }, { kind: 'literal', value: 0 }],
          line: 1,
          column: 1,
          scopePath: ['outer'],
        },
      ]);
    });

    it('VALID: {a named call, not an ambient global} => no global use', () => {
      handleCallLayerAdapterProxy();

      const result = handleCallLayerAdapter({ node: callOf({ source: PASSTHROUGH_SOURCE }), context: UNGUARDED_CONTEXT });

      expect(result.globalUses).toStrictEqual([]);
    });
  });

  describe('the children it descends so nested scopes and branches are not dropped', () => {
    it('VALID: {a call} => descends the callee and each argument', () => {
      handleCallLayerAdapterProxy();

      const result = handleCallLayerAdapter({ node: callOf({ source: PASSTHROUGH_SOURCE }), context: UNGUARDED_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['Identifier', 'Identifier']);
    });
  });

  describe('what it does NOT contribute', () => {
    it('VALID: {a call} => no branches, exits, or scope of its own', () => {
      handleCallLayerAdapterProxy();

      const result = handleCallLayerAdapter({ node: callOf({ source: PASSTHROUGH_SOURCE }), context: UNGUARDED_CONTEXT });

      expect({ branches: result.branches, exits: result.exits, opensScope: result.opensScope }).toStrictEqual({
        branches: [],
        exits: [],
        opensScope: undefined,
      });
    });
  });

  describe('the inline function an immediate invocation reaches', () => {
    it('VALID: {an IIFE ((n) => …)(7)} => reaches the arrow and, on its own channel, carries the welded args', () => {
      handleCallLayerAdapterProxy();

      const result = handleCallLayerAdapter({ node: callOf({ source: IIFE_SOURCE }), context: UNGUARDED_CONTEXT });

      expect({ reachedFns: result.reachedFns, invokedFns: result.invokedFns }).toStrictEqual({
        reachedFns: [1],
        invokedFns: [{ startLine: 1, args: [{ kind: 'literal', value: 7 }] }],
      });
    });

    it('VALID: {a named call, not an IIFE} => reaches no inline function and invokes none', () => {
      handleCallLayerAdapterProxy();

      const result = handleCallLayerAdapter({ node: callOf({ source: PASSTHROUGH_SOURCE }), context: UNGUARDED_CONTEXT });

      expect({ reachedFns: result.reachedFns, invokedFns: result.invokedFns }).toStrictEqual({
        reachedFns: [],
        invokedFns: [],
      });
    });
  });
});
