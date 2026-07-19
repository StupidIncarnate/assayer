import { exampleResolutionHarness } from '../../../../test/harnesses/example-resolution.harness';
import { resolveGraphHarness } from '../../../../test/harnesses/resolve-graph.harness';

describe('compileResolveGraphBroker (integration)', () => {
  describe('the committed cross-file example specimens resolved as one set', () => {
    const stitch = exampleResolutionHarness();

    it('VALID: {the import-local, npm-package, and node-builtin examples} => one resolved edge each — local, builtin, package — no errors', async () => {
      const result = await stitch.resolveExamples();

      expect({ edges: result.index.edges, errors: result.errors }).toStrictEqual({
        edges: [
          {
            from: 'packages/syntax-repository/src/import-local/uses-greeting.ts',
            specifier: './greeting',
            importedName: 'greeting',
            line: 1,
            column: 1,
            target: {
              kind: 'local',
              relPath: 'packages/syntax-repository/src/import-local/greeting.ts',
              signature: { params: [], returnType: { kind: 'string' } },
            },
          },
          {
            from: 'packages/syntax-repository/src/node-builtin/uses-builtin.ts',
            specifier: 'node:path',
            importedName: 'sep',
            line: 1,
            column: 1,
            target: { kind: 'builtin', packageName: 'path' },
          },
          {
            from: 'packages/syntax-repository/src/npm-package/uses-package.ts',
            specifier: 'vendored-fixture',
            importedName: 'greet',
            line: 1,
            column: 1,
            target: { kind: 'package', packageName: 'vendored-fixture' },
          },
        ],
        errors: [],
      });
    });

    it("ERROR: {an example that imports './missing'} => a hard build error at the import site and no edge", async () => {
      const result = await stitch.resolveBroken();

      expect({ edges: result.index.edges, errors: result.errors }).toStrictEqual({
        edges: [],
        errors: [
          {
            relPath: 'packages/syntax-repository/src/import-local/broken.ts',
            line: 1,
            column: 1,
            message: "cannot resolve import './missing'",
          },
        ],
      });
    });

    it('VALID: {the node-global and called-builtin examples with @types/node} => a resolved edge each — a called global, a member access, and a typed builtin — no errors', async () => {
      const result = await stitch.resolveNodeExamples();

      expect({ edges: result.index.edges, errors: result.errors }).toStrictEqual({
        edges: [
          {
            from: 'packages/syntax-repository/src/node-builtin/calls-join.ts',
            specifier: 'node:path',
            importedName: 'join',
            line: 1,
            column: 1,
            target: {
              kind: 'builtin',
              packageName: 'path',
              signature: { params: [{ name: 'paths', type: { kind: 'unknown', text: 'string[]' } }], returnType: { kind: 'string' } },
            },
          },
          {
            from: 'packages/syntax-repository/src/node-global/uses-console.ts',
            line: 3,
            column: 1,
            target: {
              kind: 'global',
              name: 'console',
              member: 'log',
              signature: { params: [{ name: 'data', type: { kind: 'unknown', text: 'any[]' } }], returnType: { kind: 'unknown', text: 'void' } },
            },
          },
          {
            from: 'packages/syntax-repository/src/node-global/uses-process.ts',
            line: 1,
            column: 21,
            target: { kind: 'global', name: 'process', member: 'env', type: { kind: 'unknown', text: 'ProcessEnv' } },
          },
          {
            from: 'packages/syntax-repository/src/node-global/uses-process.ts',
            line: 3,
            column: 20,
            target: { kind: 'global', name: 'process', member: 'cwd', signature: { params: [], returnType: { kind: 'string' } } },
          },
        ],
        errors: [],
      });
    });
  });

  describe('a multi-file repo mixing local, builtin, and package imports', () => {
    const stitch = resolveGraphHarness();

    it('VALID: {caller imports a sibling, node:fs, and a vendored package} => one resolved edge each, no errors', async () => {
      const result = await stitch.resolveMixedRepo();

      expect({ edges: result.index.edges, errors: result.errors }).toStrictEqual({
        edges: [
          {
            from: 'src/a/caller.ts',
            specifier: '../b/foo',
            importedName: 'foo',
            line: 1,
            column: 1,
            target: { kind: 'local', relPath: 'src/b/foo.ts', signature: { params: [], returnType: { kind: 'number' } } },
          },
          {
            from: 'src/a/caller.ts',
            specifier: 'node:fs',
            importedName: 'readFile',
            line: 2,
            column: 1,
            target: { kind: 'builtin', packageName: 'fs' },
          },
          {
            from: 'src/a/caller.ts',
            specifier: 'vendored-pkg',
            importedName: 'greet',
            line: 3,
            column: 1,
            target: { kind: 'package', packageName: 'vendored-pkg' },
          },
        ],
        errors: [],
      });
    });

    it('VALID: {the same repo resolved twice independently} => byte-identical resolved index (determinism)', async () => {
      const first = await stitch.resolveMixedRepo();
      const second = await stitch.resolveMixedRepo();

      expect(JSON.stringify(second.index)).toBe(JSON.stringify(first.index));
    });
  });

  describe('the same repo resolved with external type reading enabled', () => {
    const stitch = resolveGraphHarness();

    it('VALID: {a called package export with a .d.ts} => its declared signature is attached to the package edge', async () => {
      const result = await stitch.resolveTypedRepo();

      expect(result.index.edges).toStrictEqual([
        {
          from: 'src/a/caller.ts',
          specifier: '../b/foo',
          importedName: 'foo',
          line: 1,
          column: 1,
          target: { kind: 'local', relPath: 'src/b/foo.ts', signature: { params: [], returnType: { kind: 'number' } } },
        },
        {
          from: 'src/a/caller.ts',
          specifier: 'node:fs',
          importedName: 'readFile',
          line: 2,
          column: 1,
          target: { kind: 'builtin', packageName: 'fs' },
        },
        {
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
        },
      ]);
    });

    it("ERROR: {readFile is called but node:fs ships no usable types here} => a no-usable-types build error at the call site", async () => {
      const result = await stitch.resolveTypedRepo();

      expect(result.errors).toStrictEqual([
        {
          relPath: 'src/a/caller.ts',
          line: 6,
          column: 1,
          message: "import 'node:fs' has no usable types for 'readFile' (install its type declarations)",
        },
      ]);
    });
  });

  describe('a re-export barrel between the importer and the definition', () => {
    const stitch = resolveGraphHarness();

    it('VALID: {user imports foo from a barrel that re-exports it} => the local edge is keyed by the real definition', async () => {
      const result = await stitch.resolveBarrelRepo();

      expect({ edges: result.index.edges, errors: result.errors }).toStrictEqual({
        edges: [
          {
            from: 'src/barrel/index.ts',
            specifier: '../b/foo',
            importedName: 'foo',
            line: 1,
            column: 1,
            target: { kind: 'local', relPath: 'src/b/foo.ts', signature: { params: [], returnType: { kind: 'number' } } },
          },
          {
            from: 'src/c/user.ts',
            specifier: '../barrel',
            importedName: 'foo',
            line: 1,
            column: 1,
            target: { kind: 'local', relPath: 'src/b/foo.ts', signature: { params: [], returnType: { kind: 'number' } } },
          },
        ],
        errors: [],
      });
    });
  });

  describe('a file with a dynamic import() whose specifier is not a literal', () => {
    const stitch = resolveGraphHarness();

    it('ERROR: {import(name) where name is a variable} => a dynamic-or-computed-specifier build error at the import site and no edge', async () => {
      const result = await stitch.resolveDynamicRepo();

      expect({ edges: result.index.edges, errors: result.errors }).toStrictEqual({
        edges: [],
        errors: [
          {
            relPath: 'src/dynamic.ts',
            line: 2,
            column: 1,
            message: 'cannot resolve dynamic import() with a computed specifier (use a static import with a literal specifier)',
          },
        ],
      });
    });
  });

  describe('a file importing a specifier that resolves to nothing', () => {
    const stitch = resolveGraphHarness();

    it("ERROR: {import { gone } from './missing'} => a hard error with the exact relPath/line/column/message and no edge", async () => {
      const result = await stitch.resolveBrokenRepo();

      expect({ edges: result.index.edges, errors: result.errors }).toStrictEqual({
        edges: [],
        errors: [{ relPath: 'src/broken.ts', line: 1, column: 1, message: "cannot resolve import './missing'" }],
      });
    });
  });
});
