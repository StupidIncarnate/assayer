/**
 * PURPOSE: Drives the REAL owning-tsconfig lookup over a REAL monorepo layout written to a fresh temp dir: a root
 *   solution config with project references, a package config whose `exclude` drops its tests, a nested config
 *   whose `files` list skips a sibling, a two-level `extends` chain, and a second solution whose one reference is a
 *   config not named tsconfig.json. Owns all node:fs / node:os / node:path, so the colocated integration test
 *   asserts only on which config TypeScript's own parser says owns each source file. The temp dir is removed after
 *   each test (auto-wired by the harness transformer).
 *
 * USAGE:
 * const layout = tsconfigOwnerHarness();
 * const owners = layout.ownersInMonorepo();
 * // Returns one { file, owner, target, lib, strict } per source file in the layout, in layout order
 */
import { ensureDirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { dirname, join, relative } from '#gateway/node/path';

import { tsconfigOwnerBroker } from '../../src/brokers/tsconfig/owner/tsconfig-owner-broker';

const LAYOUT: readonly (readonly [string, string])[] = [
  [
    'tsconfig.json',
    '{ "files": [], "references": [{ "path": "./packages/app" }, { "path": "./packages/lib" }, { "path": "./packages/tools" }] }',
  ],
  ['tsconfig.base.json', '{ "compilerOptions": { "strict": true, "target": "ES2020" } }'],
  [
    'packages/app/tsconfig.json',
    '{ "extends": "../../tsconfig.base.json", "compilerOptions": { "lib": ["ES2022", "DOM"] }, "include": ["src"], "exclude": ["src/**/*.test.ts"] }',
  ],
  ['packages/app/src/main.ts', 'export const main = 1;\n'],
  ['packages/app/src/main.test.ts', 'export const check = 1;\n'],
  ['packages/app/src/legacy/tsconfig.json', '{ "compilerOptions": { "target": "ES5" }, "files": ["old.ts"] }'],
  ['packages/app/src/legacy/old.ts', 'export const old = 1;\n'],
  ['packages/app/src/legacy/new.ts', 'export const fresh = 1;\n'],
  [
    'packages/lib/tsconfig.mid.json',
    '{ "extends": "../../tsconfig.base.json", "compilerOptions": { "lib": ["ES2020"], "noUncheckedIndexedAccess": true } }',
  ],
  [
    'packages/lib/tsconfig.json',
    '{ "extends": "./tsconfig.mid.json", "compilerOptions": { "exactOptionalPropertyTypes": true }, "include": ["src/**/*"] }',
  ],
  ['packages/lib/src/util.ts', 'export const util = 1;\n'],
  ['packages/tools/tsconfig.json', '{ "files": [], "references": [{ "path": "./tsconfig.scripts.json" }] }'],
  ['packages/tools/tsconfig.scripts.json', '{ "compilerOptions": { "target": "ES2022" }, "include": ["scripts"] }'],
  ['packages/tools/scripts/gen.ts', 'export const gen = 1;\n'],
];

export const tsconfigOwnerHarness = (): {
  afterEach: () => void;
  ownersInMonorepo: () => { file: string; owner: string | undefined; target: unknown; lib: unknown; strict: unknown }[];
} => {
  const dirs: string[] = [];

  return {
    afterEach: (): void => {
      dirs.forEach((dir) => {
        rmSync(dir, { recursive: true, force: true });
      });
      dirs.length = 0;
    },

    ownersInMonorepo: () => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-owner-')));
      dirs.push(dir);
      LAYOUT.forEach(([path, text]) => {
        ensureDirSync(dirname(join(dir, path)));
        writeFileSync(join(dir, path), text);
      });

      return LAYOUT.filter(([path]) => path.endsWith('.ts')).map(([file]) => {
        const found = tsconfigOwnerBroker({ absPath: join(dir, file) });

        return {
          file,
          owner: found.configFilePath === undefined ? undefined : relative(dir, found.configFilePath),
          target: found.options.target,
          lib: found.options.lib,
          strict: found.options.strict,
        };
      });
    },
  };
};
