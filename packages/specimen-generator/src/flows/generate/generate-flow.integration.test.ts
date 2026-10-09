import { ensureDirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';

import { GenerateFlow } from './generate-flow';

const REAL_REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');

describe('GenerateFlow', () => {
  describe('delegation to the generate responder', () => {
    it('INVALID: {argv: [--bogus]} => returns the responder refusal', () => {
      const result = GenerateFlow({ argv: ['--bogus'], repoRoot: REAL_REPO_ROOT });

      expect(result).toStrictEqual({
        exitCode: 1,
        output:
          'specimen-generator: cannot read the argument "--bogus". It is not an accepted flag, or its value is malformed. Accepted flags: --check, --focus=<a,b>, --container=<a,b>, --depth=<whole number, 0 or more>.',
      });
    });

    it('INVALID: {argv: [--check, --depth=0]} => returns the responder refusal of a narrowed check', () => {
      const result = GenerateFlow({ argv: ['--check', '--depth=0'], repoRoot: REAL_REPO_ROOT });

      expect(result).toStrictEqual({
        exitCode: 1,
        output:
          'specimen-generator: --check always compares the full default matrix, so it cannot be combined with --focus, --container or --depth. A narrowed run would report every file it skipped as extra. Run --check with no other flag.',
      });
    });
  });

  describe('write then check in a scratch repo', () => {
    it('VALID: {write, check, then a stale refusals file} => writes, finds the files current, then reports the one that differs', () => {
      const scratchRoot = mkdtempSync(join(tmpdir(), 'specimen-generator-flow-'));
      const generatorFolder = join(scratchRoot, 'packages', 'specimen-generator');
      ensureDirSync(generatorFolder);
      symlinkSync({
        target: join(REAL_REPO_ROOT, 'packages', 'specimen-generator', 'declarations'),
        path: join(generatorFolder, 'declarations'),
        type: 'dir',
      });

      symlinkSync({
        target: join(REAL_REPO_ROOT, 'node_modules'),
        path: join(scratchRoot, 'node_modules'),
        type: 'dir',
      });

      const written = GenerateFlow({ argv: [], repoRoot: scratchRoot });
      const current = GenerateFlow({ argv: ['--check'], repoRoot: scratchRoot });
      writeFileSync(join(scratchRoot, 'smoke-repo', 'packages', 'syntax-repository', 'REFUSED.md'), 'stale');
      const drifted = GenerateFlow({ argv: ['--check'], repoRoot: scratchRoot });
      rmSync(scratchRoot, { recursive: true, force: true });

      expect({
        written: { exitCode: written.exitCode, output: written.output.replace(/\d+/gu, 'N') },
        current: { exitCode: current.exitCode, output: current.output.replace(/\d+/gu, 'N') },
        drifted,
      }).toStrictEqual({
        written: {
          exitCode: 0,
          output: 'generated N specimens into smoke-repo/packages/syntax-repository; TypeScript refused N',
        },
        current: { exitCode: 0, output: 'smoke-repo is current: N specimens' },
        drifted: {
          exitCode: 1,
          output: 'differs: REFUSED.md\nrun npm run generate:specimens to regenerate',
        },
      });
    });
  });
});
