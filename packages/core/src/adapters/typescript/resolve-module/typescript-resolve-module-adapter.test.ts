import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import ts from 'typescript';

import { typescriptResolveModuleAdapter } from './typescript-resolve-module-adapter';
import { typescriptResolveModuleAdapterProxy } from './typescript-resolve-module-adapter.proxy';

const NODE_TSCONFIG = '{ "compilerOptions": { "moduleResolution": "node", "esModuleInterop": true } }';

describe('typescriptResolveModuleAdapter', () => {
  describe('a relative specifier that resolves to a sibling file', () => {
    it('VALID: {specifier "../b/foo" from src/a/caller.ts} => resolves to the sibling absolute path', () => {
      typescriptResolveModuleAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-resolve-')));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'src', 'a'), { recursive: true });
      mkdirSync(join(dir, 'src', 'b'), { recursive: true });
      writeFileSync(join(dir, 'src', 'b', 'foo.ts'), 'export const foo = (): number => 1;\n');
      writeFileSync(join(dir, 'src', 'a', 'caller.ts'), "import { foo } from '../b/foo';\nfoo();\n");
      const parsed = ts.parseJsonConfigFileContent(
        ts.readConfigFile(join(dir, 'tsconfig.json'), (path) => ts.sys.readFile(path)).config,
        ts.sys,
        dir,
      );

      const result = typescriptResolveModuleAdapter({
        specifier: '../b/foo',
        containingFile: join(dir, 'src', 'a', 'caller.ts'),
        options: parsed.options,
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({ resolved: true, fileName: join(dir, 'src', 'b', 'foo.ts') });
    });
  });

  describe('a relative specifier that points at nothing', () => {
    it('EMPTY: {specifier "./missing"} => resolved false', () => {
      typescriptResolveModuleAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-resolve-')));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'caller.ts'), "import { x } from './missing';\n");
      const parsed = ts.parseJsonConfigFileContent(
        ts.readConfigFile(join(dir, 'tsconfig.json'), (path) => ts.sys.readFile(path)).config,
        ts.sys,
        dir,
      );

      const result = typescriptResolveModuleAdapter({
        specifier: './missing',
        containingFile: join(dir, 'src', 'caller.ts'),
        options: parsed.options,
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({ resolved: false });
    });
  });

  describe('a bare specifier that resolves into node_modules', () => {
    it('VALID: {specifier "vendored-pkg"} => resolves to the vendored package types file', () => {
      typescriptResolveModuleAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-resolve-')));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'src'), { recursive: true });
      mkdirSync(join(dir, 'node_modules', 'vendored-pkg'), { recursive: true });
      writeFileSync(
        join(dir, 'node_modules', 'vendored-pkg', 'package.json'),
        '{ "name": "vendored-pkg", "version": "1.0.0", "types": "index.d.ts" }',
      );
      writeFileSync(join(dir, 'node_modules', 'vendored-pkg', 'index.d.ts'), 'export declare const greet: () => string;\n');
      writeFileSync(join(dir, 'src', 'caller.ts'), "import { greet } from 'vendored-pkg';\n");
      const parsed = ts.parseJsonConfigFileContent(
        ts.readConfigFile(join(dir, 'tsconfig.json'), (path) => ts.sys.readFile(path)).config,
        ts.sys,
        dir,
      );

      const result = typescriptResolveModuleAdapter({
        specifier: 'vendored-pkg',
        containingFile: join(dir, 'src', 'caller.ts'),
        options: parsed.options,
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        resolved: true,
        fileName: join(dir, 'node_modules', 'vendored-pkg', 'index.d.ts'),
      });
    });
  });
});
