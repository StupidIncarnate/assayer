import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import type { EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration } from '#gateway/npm/ts-morph';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { handleTypeDeclarationLayerTransformer } from './handle-type-declaration-layer-transformer';
import { handleTypeDeclarationLayerTransformerProxy } from './handle-type-declaration-layer-transformer.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

const interfaceOf = ({ source }: { source: string }): InterfaceDeclaration =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.InterfaceDeclaration);

const aliasOf = ({ source }: { source: string }): TypeAliasDeclaration =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.TypeAliasDeclaration);

const enumOf = ({ source }: { source: string }): EnumDeclaration =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.EnumDeclaration);

describe('handleTypeDeclarationLayerTransformer', () => {
  describe('the shape it records', () => {
    it('VALID: {an interface no signature mentions} => one named object shape with its full property list', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: interfaceOf({ source: 'export interface Config { mode: string; retries: number }\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.declaredShapes).toStrictEqual([
        {
          name: 'Config',
          type: {
            kind: 'object',
            typeName: 'Config',
            properties: [
              { name: 'mode', type: { kind: 'string' } },
              { name: 'retries', type: { kind: 'number' } },
            ],
          },
        },
      ]);
    });

    // The two spellings of one concept must be indistinguishable downstream: an alias hangs its name on
    // the ALIAS symbol while its object symbol is the anonymous `__type`, so reading only the object
    // symbol would spell this shape keyless and drop it out of every name-keyed artifact.
    it('VALID: {a type alias to an object literal} => the same named object shape an interface gives', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: aliasOf({ source: 'export type Config = { mode: string; retries: number };\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.declaredShapes).toStrictEqual([
        {
          name: 'Config',
          type: {
            kind: 'object',
            typeName: 'Config',
            properties: [
              { name: 'mode', type: { kind: 'string' } },
              { name: 'retries', type: { kind: 'number' } },
            ],
          },
        },
      ]);
    });

    // The alias's descriptor has no name slot of its own, so the DECLARATION's name is the only thing
    // that can carry it — without which no name-keyed resolution could ever reach a scalar or union alias.
    it('VALID: {a type alias to a union} => the union shape under the declared name', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: aliasOf({ source: "export type Method = 'get' | 'post';\n" }),
        context: MODULE_CONTEXT,
      });

      expect(result.declaredShapes).toStrictEqual([
        {
          name: 'Method',
          type: {
            kind: 'union',
            members: [
              { kind: 'literal', value: 'get' },
              { kind: 'literal', value: 'post' },
            ],
          },
        },
      ]);
    });

    it('EMPTY: {an interface with no members} => a named object shape with an empty property list', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: interfaceOf({ source: 'export interface Empty {}\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.declaredShapes).toStrictEqual([
        { name: 'Empty', type: { kind: 'object', typeName: 'Empty', properties: [] } },
      ]);
    });

    // An enum belongs on the SAME channel an alias to a literal union does: a reader typed `Level`
    // demands exactly what the enum's members enumerate, and the same reader answers both.
    it('VALID: {an enum} => the union of its member values, under the declared name', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: enumOf({ source: 'enum Level {\n  Low,\n  High,\n}\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.declaredShapes).toStrictEqual([
        {
          name: 'Level',
          type: {
            kind: 'union',
            members: [
              { kind: 'literal', value: 0 },
              { kind: 'literal', value: 1 },
            ],
          },
        },
      ]);
    });

    // The declaration's type PARAMETERS ride beside the descriptor, in order — the slots a reference's
    // type ARGUMENTS fill (packages/core/CLAUDE.md §4) — for both an interface and an alias to an
    // object literal.
    it('VALID: {a generic interface} => the shape carries its type PARAMETERS beside the descriptor', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: interfaceOf({ source: 'export interface Box<T> {\n  value: T;\n}\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.declaredShapes).toStrictEqual([
        {
          name: 'Box',
          type: {
            kind: 'object',
            typeName: 'Box',
            properties: [{ name: 'value', type: { kind: 'unknown', text: 'T', typeRef: 'T' } }],
          },
          typeParams: ['T'],
        },
      ]);
    });

    it('VALID: {a generic type alias} => the SAME shape a generic interface gives', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: aliasOf({ source: 'export type Box<T> = {\n  value: T;\n};\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.declaredShapes).toStrictEqual([
        {
          name: 'Box',
          type: {
            kind: 'object',
            typeName: 'Box',
            properties: [{ name: 'value', type: { kind: 'unknown', text: 'T', typeRef: 'T' } }],
          },
          typeParams: ['T'],
        },
      ]);
    });
  });

  describe('what it does NOT contribute', () => {
    it('VALID: {an interface} => no branches, exits, calls, or scope of its own', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: interfaceOf({ source: 'interface Config { mode: string }\n' }),
        context: MODULE_CONTEXT,
      });

      expect({
        branches: result.branches,
        exits: result.exits,
        calls: result.calls,
        opensScope: result.opensScope,
      }).toStrictEqual({ branches: [], exits: [], calls: [], opensScope: undefined });
    });

    // Descending is how nothing inside a declaration is dropped (§5.6) — the same descent the default
    // dispatch branch takes for a node no handler claims.
    it('VALID: {an interface} => descends its children under the unchanged context', () => {
      handleTypeDeclarationLayerTransformerProxy();

      const result = handleTypeDeclarationLayerTransformer({
        node: interfaceOf({ source: 'interface Config { mode: string }\n' }),
        context: MODULE_CONTEXT,
      });

      expect(result.descents.map((descent) => ({ kind: descent.node.getKindName(), context: descent.context }))).toStrictEqual([
        { kind: 'Identifier', context: MODULE_CONTEXT },
        { kind: 'PropertySignature', context: MODULE_CONTEXT },
      ]);
    });
  });
});
