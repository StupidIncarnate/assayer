import { readFileSyncIfExists, walkFilesSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { StartSpecimenGenerator } from './start-specimen-generator';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const OUT_ROOT = join(REPO_ROOT, 'smoke-repo', 'packages', 'syntax-repository');

describe('StartSpecimenGenerator', () => {
  describe('check mode against the committed smoke-repo', () => {
    it('VALID: {argv: [--check]} => exit 0, since the committed files match a fresh generation', () => {
      const { exitCode, output } = StartSpecimenGenerator({ argv: ['--check'], repoRoot: REPO_ROOT });

      expect({ exitCode, firstWords: output.split(':')[0] }).toStrictEqual({
        exitCode: 0,
        firstWords: 'smoke-repo is current',
      });
    });
  });

  describe('refused arguments', () => {
    it('INVALID: {argv: [--bogus]} => exit 1 with the refusal text, and nothing is written', () => {
      const manifestBefore = readFileSyncIfExists(join(OUT_ROOT, 'specimen-manifest.json'));
      const sourceBefore = walkFilesSync({ rootPath: join(OUT_ROOT, 'src'), suffix: '' }).map(({ path }) => path);

      const result = StartSpecimenGenerator({ argv: ['--bogus'], repoRoot: REPO_ROOT });

      const manifestAfter = readFileSyncIfExists(join(OUT_ROOT, 'specimen-manifest.json'));
      const sourceAfter = walkFilesSync({ rootPath: join(OUT_ROOT, 'src'), suffix: '' }).map(({ path }) => path);

      expect({ result, manifest: manifestAfter, files: sourceAfter }).toStrictEqual({
        result: {
          exitCode: 1,
          output:
            'specimen-generator: cannot read the argument "--bogus". It is not an accepted flag, or its value is malformed. Accepted flags: --check, --focus=<a,b>, --container=<a,b>, --depth=<whole number, 0 or more>.',
        },
        manifest: manifestBefore,
        files: sourceBefore,
      });
    });
  });

  describe('a focus no declaration names', () => {
    it('ERROR: {argv: [--focus=nope]} => exit 1 naming nope', () => {
      const { exitCode, output } = StartSpecimenGenerator({ argv: ['--focus=nope'], repoRoot: REPO_ROOT });

      expect(exitCode).toBe(1);
      expect(output).toMatch(
        /^The focus 'nope' matches no syntax or shim declaration\. The known names are: .+\. Name one of them, or add declarations\/syntax\/nope\.syntax\.ts\.$/u,
      );
    });
  });
});
