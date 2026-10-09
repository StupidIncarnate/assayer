import { ManifestEntryStub } from '../../contracts/manifest-entry/manifest-entry.stub';
import { SpecimenOutcomeStub } from '../../contracts/specimen-outcome/specimen-outcome.stub';
import { specimenTestSourceTransformer } from './specimen-test-source-transformer';

describe('specimenTestSourceTransformer', () => {
  describe('the plainest prediction', () => {
    it('VALID: {six folders deep, one branch driven both ways} => returns the whole test file', () => {
      const { folder, relPath } = ManifestEntryStub();
      const prediction = SpecimenOutcomeStub();

      const result = specimenTestSourceTransformer({
        folder,
        relPath,
        depthToRepoRoot: 6,
        title: 'VALID: {value: param} => if on line 2 driven both ways, every case passes',
        prediction,
      });

      expect(result).toBe(
        [
          "import { join } from 'path';",
          '',
          "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
          '',
          "describe('if-number-function-declaration-body-cond-gt-number-value-param', () => {",
          "    it('VALID: {value: param} => if on line 2 driven both ways, every case passes', async () => {",
          '        const observation = await specimenObserveBroker({',
          "            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),",
          "            relPath: 'packages/syntax-repository/src/if/function-declaration/if-number-function-declaration-body-cond-gt-number-value-param/if-number-function-declaration-body-cond-gt-number-value-param.ts'",
          '        });',
          '        expect(observation).toStrictEqual({',
          "            branches: [{ kind: 'if', line: 2, driven: 'both-ways' }],",
          '            caseFailures: [],',
          '            lints: [],',
          '            undriven: [],',
          '            darkSpots: [],',
          '            gaps: []',
          '        });',
          '    });',
          '});',
          '',
        ].join('\n'),
      );
    });
  });

  describe('depth', () => {
    it('EDGE: {depthToRepoRoot: 0} => passes only __dirname to join', () => {
      const prediction = SpecimenOutcomeStub({ branches: [] });

      const result = specimenTestSourceTransformer({
        folder: 'a',
        relPath: 'p/a.ts',
        depthToRepoRoot: 0,
        title: 'VALID: {value: param} => every case passes',
        prediction,
      });

      expect(result).toBe(
        [
          "import { join } from 'path';",
          '',
          "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
          '',
          "describe('a', () => {",
          "    it('VALID: {value: param} => every case passes', async () => {",
          '        const observation = await specimenObserveBroker({',
          '            repoRoot: join(__dirname),',
          "            relPath: 'p/a.ts'",
          '        });',
          '        expect(observation).toStrictEqual({',
          '            branches: [],',
          '            caseFailures: [],',
          '            lints: [],',
          '            undriven: [],',
          '            darkSpots: [],',
          '            gaps: []',
          '        });',
          '    });',
          '});',
          '',
        ].join('\n'),
      );
    });
  });

  describe('every outcome field', () => {
    it('VALID: {several branches, a failure, lints, undriven, dark spots and gaps} => prints every row in contract order', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [
          { kind: 'if', line: 2, driven: 'one-way' },
          { kind: 'ternary', line: 6, driven: 'never' },
          { kind: 'switch', line: 9, driven: 'both-ways' },
        ],
        caseFailures: [{ status: 'failed', message: 'first' }],
        lints: [
          { rule: 'unreachable-exit', startLine: 4 },
          { rule: 'dead-surface', startLine: 8 },
        ],
        undriven: [{ startLine: 1 }],
        darkSpots: [{ startLine: 3 }],
        gaps: [{ name: 'value' }],
      });

      const result = specimenTestSourceTransformer({
        folder: 'b',
        relPath: 'p/b.ts',
        depthToRepoRoot: 1,
        title: 'VALID: {value: external} => many',
        prediction,
      });

      expect(result).toBe(
        [
          "import { join } from 'path';",
          '',
          "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
          '',
          "describe('b', () => {",
          "    it('VALID: {value: external} => many', async () => {",
          '        const observation = await specimenObserveBroker({',
          "            repoRoot: join(__dirname, '..'),",
          "            relPath: 'p/b.ts'",
          '        });',
          '        expect(observation).toStrictEqual({',
          '            branches: [{ kind: \'if\', line: 2, driven: \'one-way\' }, { kind: \'ternary\', line: 6, driven: \'never\' }, { kind: \'switch\', line: 9, driven: \'both-ways\' }],',
          "            caseFailures: [{ status: 'failed', message: 'first' }],",
          "            lints: [{ rule: 'unreachable-exit', startLine: 4 }, { rule: 'dead-surface', startLine: 8 }],",
          '            undriven: [{ startLine: 1 }],',
          '            darkSpots: [{ startLine: 3 }],',
          "            gaps: [{ name: 'value' }]",
          '        });',
          '    });',
          '});',
          '',
        ].join('\n'),
      );
    });
  });

  describe('escaping', () => {
    it('EDGE: {a failure message with both quote kinds and a backslash} => escapes it so the text stays valid', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [],
        caseFailures: [{ status: 'errored', message: 'it\'s "bad" \\ here' }],
      });

      const result = specimenTestSourceTransformer({
        folder: 'c',
        relPath: 'p/c.ts',
        depthToRepoRoot: 1,
        title: "VALID: {value: param} => it's fine",
        prediction,
      });

      expect(result).toBe(
        [
          "import { join } from 'path';",
          '',
          "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
          '',
          "describe('c', () => {",
          "    it('VALID: {value: param} => it\\'s fine', async () => {",
          '        const observation = await specimenObserveBroker({',
          "            repoRoot: join(__dirname, '..'),",
          "            relPath: 'p/c.ts'",
          '        });',
          '        expect(observation).toStrictEqual({',
          '            branches: [],',
          "            caseFailures: [{ status: 'errored', message: 'it\\'s \"bad\" \\\\ here' }],",
          '            lints: [],',
          '            undriven: [],',
          '            darkSpots: [],',
          '            gaps: []',
          '        });',
          '    });',
          '});',
          '',
        ].join('\n'),
      );
    });
  });
});
