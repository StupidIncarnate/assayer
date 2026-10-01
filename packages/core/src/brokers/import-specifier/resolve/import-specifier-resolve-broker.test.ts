import { ensureDirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';

import ts from '#gateway/npm/typescript';

import { importSpecifierResolveBroker } from './import-specifier-resolve-broker';
import { importSpecifierResolveBrokerProxy } from './import-specifier-resolve-broker.proxy';

const NODE_TSCONFIG = '{ "compilerOptions": { "moduleResolution": "node", "esModuleInterop": true } }';

describe('importSpecifierResolveBroker', () => {
  describe('a relative specifier that resolves to a sibling file', () => {
    it('VALID: {specifier "../b/foo" from src/a/caller.ts} => resolves to the sibling absolute path', () => {
      importSpecifierResolveBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-resolve-')));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      ensureDirSync(join(dir, 'src', 'a'));
      ensureDirSync(join(dir, 'src', 'b'));
      writeFileSync(join(dir, 'src', 'b', 'foo.ts'), 'export const foo = (): number => 1;\n');
      writeFileSync(join(dir, 'src', 'a', 'caller.ts'), "import { foo } from '../b/foo';\nfoo();\n");
      const parsed = ts.parseJsonConfigFileContent(
        ts.readConfigFile(join(dir, 'tsconfig.json'), (path) => ts.sys.readFile(path)).config,
        ts.sys,
        dir,
      );

      const result = importSpecifierResolveBroker({
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
      importSpecifierResolveBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-resolve-')));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      ensureDirSync(join(dir, 'src'));
      writeFileSync(join(dir, 'src', 'caller.ts'), "import { x } from './missing';\n");
      const parsed = ts.parseJsonConfigFileContent(
        ts.readConfigFile(join(dir, 'tsconfig.json'), (path) => ts.sys.readFile(path)).config,
        ts.sys,
        dir,
      );

      const result = importSpecifierResolveBroker({
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
      importSpecifierResolveBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-resolve-')));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      ensureDirSync(join(dir, 'src'));
      ensureDirSync(join(dir, 'node_modules', 'vendored-pkg'));
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

      const result = importSpecifierResolveBroker({
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
