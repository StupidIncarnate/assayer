import { resolvedEdgeContract } from './resolved-edge-contract';
import { ResolvedEdgeStub } from './resolved-edge.stub';

describe('resolvedEdgeContract', () => {
  describe('valid resolved edges', () => {
    it('VALID: {stub default} => a local edge keyed on its definition path', () => {
      const edge = ResolvedEdgeStub();

      const result = resolvedEdgeContract.parse(edge);

      expect(result).toStrictEqual({
        from: 'src/a/caller.ts',
        specifier: '../b/foo',
        importedName: 'foo',
        line: 1,
        column: 1,
        target: { kind: 'local', relPath: 'src/b/foo.ts' },
      });
    });

    it('VALID: {a local target carrying its exported signature} => keyed by definition path with params + return', () => {
      const result = resolvedEdgeContract.parse({
        from: 'src/a/caller.ts',
        specifier: './greeting',
        importedName: 'greeting',
        line: 1,
        column: 1,
        target: {
          kind: 'local',
          relPath: 'src/happy-path/import-local/uses-greeting/greeting.ts',
          signature: { params: [], returnType: { kind: 'string' } },
        },
      });

      expect(result).toStrictEqual({
        from: 'src/a/caller.ts',
        specifier: './greeting',
        importedName: 'greeting',
        line: 1,
        column: 1,
        target: {
          kind: 'local',
          relPath: 'src/happy-path/import-local/uses-greeting/greeting.ts',
          signature: { params: [], returnType: { kind: 'string' } },
        },
      });
    });

    it('VALID: {a package target} => keyed by package name', () => {
      const result = resolvedEdgeContract.parse({
        from: 'src/a/caller.ts',
        specifier: 'react',
        importedName: 'useState',
        line: 2,
        column: 1,
        target: { kind: 'package', packageName: 'react' },
      });

      expect(result).toStrictEqual({
        from: 'src/a/caller.ts',
        specifier: 'react',
        importedName: 'useState',
        line: 2,
        column: 1,
        target: { kind: 'package', packageName: 'react' },
      });
    });

    it('VALID: {a package target carrying its declared signature} => keyed by name with params + return', () => {
      const result = resolvedEdgeContract.parse({
        from: 'src/a/caller.ts',
        specifier: 'vendored-pkg',
        importedName: 'greet',
        line: 3,
        column: 1,
        target: {
          kind: 'package',
          packageName: 'vendored-pkg',
          signature: { params: [], returnType: { kind: 'string' } },
        },
      });

      expect(result).toStrictEqual({
        from: 'src/a/caller.ts',
        specifier: 'vendored-pkg',
        importedName: 'greet',
        line: 3,
        column: 1,
        target: {
          kind: 'package',
          packageName: 'vendored-pkg',
          signature: { params: [], returnType: { kind: 'string' } },
        },
      });
    });

    it('VALID: {a builtin target used as a value carrying its member type} => keyed by builtin name with a type', () => {
      const result = resolvedEdgeContract.parse({
        from: 'src/happy-path/node-builtin/uses-builtin/uses-builtin.ts',
        specifier: 'node:path',
        importedName: 'sep',
        line: 1,
        column: 1,
        target: { kind: 'builtin', packageName: 'path', type: { kind: 'string' } },
      });

      expect(result).toStrictEqual({
        from: 'src/happy-path/node-builtin/uses-builtin/uses-builtin.ts',
        specifier: 'node:path',
        importedName: 'sep',
        line: 1,
        column: 1,
        target: { kind: 'builtin', packageName: 'path', type: { kind: 'string' } },
      });
    });

    it('VALID: {a package target used as a value carrying its type} => keyed by package name with a type', () => {
      const result = resolvedEdgeContract.parse({
        from: 'src/a/caller.ts',
        specifier: 'vendored-pkg',
        importedName: 'VERSION',
        line: 2,
        column: 1,
        target: { kind: 'package', packageName: 'vendored-pkg', type: { kind: 'string' } },
      });

      expect(result).toStrictEqual({
        from: 'src/a/caller.ts',
        specifier: 'vendored-pkg',
        importedName: 'VERSION',
        line: 2,
        column: 1,
        target: { kind: 'package', packageName: 'vendored-pkg', type: { kind: 'string' } },
      });
    });

    it('VALID: {a builtin target with no importedName} => a side-effect/namespace edge keyed by builtin name', () => {
      const result = resolvedEdgeContract.parse({
        from: 'src/a/caller.ts',
        specifier: 'node:fs',
        line: 3,
        column: 1,
        target: { kind: 'builtin', packageName: 'fs' },
      });

      expect(result).toStrictEqual({
        from: 'src/a/caller.ts',
        specifier: 'node:fs',
        line: 3,
        column: 1,
        target: { kind: 'builtin', packageName: 'fs' },
      });
    });
  });

    it('VALID: {a global target for a called method} => keyed by name+member carrying its signature, no specifier', () => {
      const result = resolvedEdgeContract.parse({
        from: 'src/a/caller.ts',
        line: 1,
        column: 1,
        target: {
          kind: 'global',
          name: 'console',
          member: 'log',
          signature: { params: [{ name: 'message', type: { kind: 'unknown', text: 'any' } }], returnType: { kind: 'unknown', text: 'void' } },
        },
      });

      expect(result).toStrictEqual({
        from: 'src/a/caller.ts',
        line: 1,
        column: 1,
        target: {
          kind: 'global',
          name: 'console',
          member: 'log',
          signature: { params: [{ name: 'message', type: { kind: 'unknown', text: 'any' } }], returnType: { kind: 'unknown', text: 'void' } },
        },
      });
    });

    it('VALID: {a global target for a member access} => keyed by name+member carrying the member type', () => {
      const result = resolvedEdgeContract.parse({
        from: 'src/a/caller.ts',
        line: 3,
        column: 1,
        target: { kind: 'global', name: 'process', member: 'env', type: { kind: 'unknown', text: 'ProcessEnv' } },
      });

      expect(result).toStrictEqual({
        from: 'src/a/caller.ts',
        line: 3,
        column: 1,
        target: { kind: 'global', name: 'process', member: 'env', type: { kind: 'unknown', text: 'ProcessEnv' } },
      });
    });

  describe('invalid resolved edges', () => {
    it('INVALID: {target kind "unresolved"} => throws on the target discriminator', () => {
      expect(() => {
        return resolvedEdgeContract.parse({
          from: 'src/a/caller.ts',
          specifier: './missing',
          line: 1,
          column: 1,
          target: { kind: 'unresolved' },
        });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
