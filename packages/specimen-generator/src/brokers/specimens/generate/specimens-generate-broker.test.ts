import { GeneratorArgsStub } from '../../../contracts/generator-args/generator-args.stub';
import { specimensGenerateBroker } from './specimens-generate-broker';
import { specimensGenerateBrokerProxy } from './specimens-generate-broker.proxy';

const ROOT = '/virtual/declarations';
const IF_FOLDER_PREFIX = 'if-number-function-declaration-body-cond';
const IF_BOOLEAN_PREFIX = 'if-boolean-function-declaration-body-cond';
const IF_DIRECTORY = 'src/if/function-declaration';
const IF_ASSAYER_DIRECTORY = 'packages/syntax-repository/src/if/function-declaration';

describe('specimensGenerateBroker', () => {
  describe('one focus in one container', () => {
    it('VALID: {focus: if, container: function-declaration, depth: 0} => returns each specimen, its test, the manifest and the refusals', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT });

      const result = specimensGenerateBroker({
        declarationsRoot: ROOT,
        args: GeneratorArgsStub({ mode: 'write', focus: ['if'], container: ['function-declaration'], depth: 0 }),
      });

      expect(result).toStrictEqual({
        files: [
          {
            relPath: 'REFUSED.md',
            content: [
              '# Specimens TypeScript refused',
              '',
              "The generator does not write a specimen that TypeScript rejects, and lists it here with TypeScript's reason.",
              '',
              'None.',
              '',
            ].join('\n'),
          },
          {
            relPath: 'specimen-manifest.json',
            content: [
              '[',
              '  {',
              `    "folder": "${IF_BOOLEAN_PREFIX}-const",`,
              `    "relPath": "${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-const/${IF_BOOLEAN_PREFIX}-const.ts",`,
              '    "focus": "if",',
              '    "container": "function-declaration",',
              '    "slot": "body",',
              '    "path": "cond",',
              '    "provenance": "const",',
              '    "uses": [',
              '      "if"',
              '    ],',
              '    "verdict": "locked"',
              '  },',
              '  {',
              `    "folder": "${IF_BOOLEAN_PREFIX}-external",`,
              `    "relPath": "${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-external/${IF_BOOLEAN_PREFIX}-external.ts",`,
              '    "focus": "if",',
              '    "container": "function-declaration",',
              '    "slot": "body",',
              '    "path": "cond",',
              '    "provenance": "external",',
              '    "uses": [',
              '      "if"',
              '    ],',
              '    "verdict": "undriven"',
              '  },',
              '  {',
              `    "folder": "${IF_BOOLEAN_PREFIX}-param",`,
              `    "relPath": "${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-param/${IF_BOOLEAN_PREFIX}-param.ts",`,
              '    "focus": "if",',
              '    "container": "function-declaration",',
              '    "slot": "body",',
              '    "path": "cond",',
              '    "provenance": "param",',
              '    "uses": [',
              '      "if"',
              '    ],',
              '    "verdict": "driven"',
              '  },',
              '  {',
              `    "folder": "${IF_FOLDER_PREFIX}-const",`,
              `    "relPath": "${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-const/${IF_FOLDER_PREFIX}-const.ts",`,
              '    "focus": "if",',
              '    "container": "function-declaration",',
              '    "slot": "body",',
              '    "path": "cond",',
              '    "provenance": "const",',
              '    "uses": [',
              '      "if"',
              '    ],',
              '    "verdict": "locked"',
              '  },',
              '  {',
              `    "folder": "${IF_FOLDER_PREFIX}-external",`,
              `    "relPath": "${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-external/${IF_FOLDER_PREFIX}-external.ts",`,
              '    "focus": "if",',
              '    "container": "function-declaration",',
              '    "slot": "body",',
              '    "path": "cond",',
              '    "provenance": "external",',
              '    "uses": [',
              '      "if"',
              '    ],',
              '    "verdict": "undriven"',
              '  },',
              '  {',
              `    "folder": "${IF_FOLDER_PREFIX}-param",`,
              `    "relPath": "${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-param/${IF_FOLDER_PREFIX}-param.ts",`,
              '    "focus": "if",',
              '    "container": "function-declaration",',
              '    "slot": "body",',
              '    "path": "cond",',
              '    "provenance": "param",',
              '    "uses": [',
              '      "if"',
              '    ],',
              '    "verdict": "driven"',
              '  }',
              ']',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_BOOLEAN_PREFIX}-const/${IF_BOOLEAN_PREFIX}-const.test.ts`,
            content: [
              "import { join } from 'path';",
              '',
              "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
              '',
              `describe('${IF_BOOLEAN_PREFIX}-const', () => {`,
              "    it('VALID: {cond: const} => if on line 4 locked one way, unreachable-exit on line 7, every case passes', async () => {",
              '        const observation = await specimenObserveBroker({',
              "            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),",
              `            relPath: '${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-const/${IF_BOOLEAN_PREFIX}-const.ts'`,
              '        });',
              '        expect(observation).toStrictEqual({',
              "            branches: [{ kind: 'if', line: 4, driven: 'one-way' }],",
              '            caseFailures: [],',
              "            lints: [{ rule: 'unreachable-exit', startLine: 7 }],",
              '            undriven: [],',
              '            darkSpots: [],',
              '            gaps: []',
              '        });',
              '    });',
              '});',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_BOOLEAN_PREFIX}-const/${IF_BOOLEAN_PREFIX}-const.ts`,
            content: [
              'const cond: boolean = true;',
              '',
              'export function ifBooleanFunctionDeclarationBodyCondConst(): string {',
              '    if (cond) {',
              "        return 'then';",
              '    }',
              "    return 'else';",
              '}',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_BOOLEAN_PREFIX}-external/${IF_BOOLEAN_PREFIX}-external.test.ts`,
            content: [
              "import { join } from 'path';",
              '',
              "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
              '',
              `describe('${IF_BOOLEAN_PREFIX}-external', () => {`,
              "    it('VALID: {cond: external} => if on line 2 never run, undriven from line 2, every case passes', async () => {",
              '        const observation = await specimenObserveBroker({',
              "            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),",
              `            relPath: '${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-external/${IF_BOOLEAN_PREFIX}-external.ts'`,
              '        });',
              '        expect(observation).toStrictEqual({',
              "            branches: [{ kind: 'if', line: 2, driven: 'never' }],",
              '            caseFailures: [],',
              "            lints: [],",
              '            undriven: [{ startLine: 2 }],',
              '            darkSpots: [],',
              '            gaps: []',
              '        });',
              '    });',
              '});',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_BOOLEAN_PREFIX}-external/${IF_BOOLEAN_PREFIX}-external.ts`,
            content: [
              'export function ifBooleanFunctionDeclarationBodyCondExternal(): string {',
              "    if (process.argv[2] === 'yes') {",
              "        return 'then';",
              '    }',
              "    return 'else';",
              '}',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_BOOLEAN_PREFIX}-param/${IF_BOOLEAN_PREFIX}-param.test.ts`,
            content: [
              "import { join } from 'path';",
              '',
              "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
              '',
              `describe('${IF_BOOLEAN_PREFIX}-param', () => {`,
              "    it('VALID: {cond: param} => if on line 2 driven both ways, every case passes', async () => {",
              '        const observation = await specimenObserveBroker({',
              "            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),",
              `            relPath: '${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-param/${IF_BOOLEAN_PREFIX}-param.ts'`,
              '        });',
              '        expect(observation).toStrictEqual({',
              "            branches: [{ kind: 'if', line: 2, driven: 'both-ways' }],",
              '            caseFailures: [],',
              "            lints: [],",
              '            undriven: [],',
              '            darkSpots: [],',
              '            gaps: []',
              '        });',
              '    });',
              '});',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_BOOLEAN_PREFIX}-param/${IF_BOOLEAN_PREFIX}-param.ts`,
            content: [
              'export function ifBooleanFunctionDeclarationBodyCondParam(cond: boolean): string {',
              '    if (cond) {',
              "        return 'then';",
              '    }',
              "    return 'else';",
              '}',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_FOLDER_PREFIX}-const/${IF_FOLDER_PREFIX}-const.test.ts`,
            content: [
              "import { join } from 'path';",
              '',
              "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
              '',
              `describe('${IF_FOLDER_PREFIX}-const', () => {`,
              "    it('VALID: {cond: const} => if on line 4 locked one way, unreachable-exit on line 7, every case passes', async () => {",
              '        const observation = await specimenObserveBroker({',
              "            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),",
              `            relPath: '${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-const/${IF_FOLDER_PREFIX}-const.ts'`,
              '        });',
              '        expect(observation).toStrictEqual({',
              "            branches: [{ kind: 'if', line: 4, driven: 'one-way' }],",
              '            caseFailures: [],',
              "            lints: [{ rule: 'unreachable-exit', startLine: 7 }],",
              '            undriven: [],',
              '            darkSpots: [],',
              '            gaps: []',
              '        });',
              '    });',
              '});',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_FOLDER_PREFIX}-const/${IF_FOLDER_PREFIX}-const.ts`,
            content: [
              'const cond: number = 3;',
              '',
              'export function ifNumberFunctionDeclarationBodyCondConst(): string {',
              '    if (cond) {',
              "        return 'then';",
              '    }',
              "    return 'else';",
              '}',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_FOLDER_PREFIX}-external/${IF_FOLDER_PREFIX}-external.test.ts`,
            content: [
              "import { join } from 'path';",
              '',
              "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
              '',
              `describe('${IF_FOLDER_PREFIX}-external', () => {`,
              "    it('VALID: {cond: external} => if on line 2 never run, undriven from line 2, every case passes', async () => {",
              '        const observation = await specimenObserveBroker({',
              "            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),",
              `            relPath: '${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-external/${IF_FOLDER_PREFIX}-external.ts'`,
              '        });',
              '        expect(observation).toStrictEqual({',
              "            branches: [{ kind: 'if', line: 2, driven: 'never' }],",
              '            caseFailures: [],',
              '            lints: [],',
              '            undriven: [{ startLine: 2 }],',
              '            darkSpots: [],',
              '            gaps: []',
              '        });',
              '    });',
              '});',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_FOLDER_PREFIX}-external/${IF_FOLDER_PREFIX}-external.ts`,
            content: [
              'export function ifNumberFunctionDeclarationBodyCondExternal(): string {',
              '    if (Number(process.argv[2])) {',
              "        return 'then';",
              '    }',
              "    return 'else';",
              '}',
              '',
            ].join('\n'),
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_FOLDER_PREFIX}-param/${IF_FOLDER_PREFIX}-param.test.ts`,
            content: [
              "import { join } from 'path';",
              '',
              "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
              '',
              `describe('${IF_FOLDER_PREFIX}-param', () => {`,
              "    it('VALID: {cond: param} => if on line 2 driven both ways, every case passes', async () => {",
              '        const observation = await specimenObserveBroker({',
              "            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),",
              `            relPath: '${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-param/${IF_FOLDER_PREFIX}-param.ts'`,
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
          },
          {
            relPath: `${IF_DIRECTORY}/${IF_FOLDER_PREFIX}-param/${IF_FOLDER_PREFIX}-param.ts`,
            content: [
              'export function ifNumberFunctionDeclarationBodyCondParam(cond: number): string {',
              '    if (cond) {',
              "        return 'then';",
              '    }',
              "    return 'else';",
              '}',
              '',
            ].join('\n'),
          },
        ],
        refused: [],
        manifest: [
          {
            folder: `${IF_BOOLEAN_PREFIX}-const`,
            relPath: `${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-const/${IF_BOOLEAN_PREFIX}-const.ts`,
            focus: 'if',
            container: 'function-declaration',
            slot: 'body',
            path: 'cond',
            provenance: 'const',
            uses: ['if'],
            verdict: 'locked',
          },
          {
            folder: `${IF_BOOLEAN_PREFIX}-external`,
            relPath: `${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-external/${IF_BOOLEAN_PREFIX}-external.ts`,
            focus: 'if',
            container: 'function-declaration',
            slot: 'body',
            path: 'cond',
            provenance: 'external',
            uses: ['if'],
            verdict: 'undriven',
          },
          {
            folder: `${IF_BOOLEAN_PREFIX}-param`,
            relPath: `${IF_ASSAYER_DIRECTORY}/${IF_BOOLEAN_PREFIX}-param/${IF_BOOLEAN_PREFIX}-param.ts`,
            focus: 'if',
            container: 'function-declaration',
            slot: 'body',
            path: 'cond',
            provenance: 'param',
            uses: ['if'],
            verdict: 'driven',
          },
          {
            folder: `${IF_FOLDER_PREFIX}-const`,
            relPath: `${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-const/${IF_FOLDER_PREFIX}-const.ts`,
            focus: 'if',
            container: 'function-declaration',
            slot: 'body',
            path: 'cond',
            provenance: 'const',
            uses: ['if'],
            verdict: 'locked',
          },
          {
            folder: `${IF_FOLDER_PREFIX}-external`,
            relPath: `${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-external/${IF_FOLDER_PREFIX}-external.ts`,
            focus: 'if',
            container: 'function-declaration',
            slot: 'body',
            path: 'cond',
            provenance: 'external',
            uses: ['if'],
            verdict: 'undriven',
          },
          {
            folder: `${IF_FOLDER_PREFIX}-param`,
            relPath: `${IF_ASSAYER_DIRECTORY}/${IF_FOLDER_PREFIX}-param/${IF_FOLDER_PREFIX}-param.ts`,
            focus: 'if',
            container: 'function-declaration',
            slot: 'body',
            path: 'cond',
            provenance: 'param',
            uses: ['if'],
            verdict: 'driven',
          },
        ],
      });
    });
  });

  describe('a nested fill', () => {
    it('VALID: {focus: if, container: function-declaration, depth omitted} => adds the specimens whose condition is a gt or nullish node, in relPath order', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT });

      const result = specimensGenerateBroker({
        declarationsRoot: ROOT,
        args: GeneratorArgsStub({ mode: 'write', focus: ['if'], container: ['function-declaration'] }),
      });

      expect(result.files.map(({ relPath }) => relPath)).toStrictEqual([
        'REFUSED.md',
        'specimen-manifest.json',
        ...[
          `${IF_BOOLEAN_PREFIX}-const`,
          `${IF_BOOLEAN_PREFIX}-external`,
          `${IF_BOOLEAN_PREFIX}-gt-number-value-const`,
          `${IF_BOOLEAN_PREFIX}-gt-number-value-external`,
          `${IF_BOOLEAN_PREFIX}-gt-number-value-param`,
          `${IF_BOOLEAN_PREFIX}-nullish-boolean-value-const`,
          `${IF_BOOLEAN_PREFIX}-nullish-boolean-value-external`,
          `${IF_BOOLEAN_PREFIX}-nullish-boolean-value-param`,
          `${IF_BOOLEAN_PREFIX}-param`,
          `${IF_FOLDER_PREFIX}-const`,
          `${IF_FOLDER_PREFIX}-external`,
          `${IF_FOLDER_PREFIX}-nullish-number-value-const`,
          `${IF_FOLDER_PREFIX}-nullish-number-value-external`,
          `${IF_FOLDER_PREFIX}-nullish-number-value-param`,
          `${IF_FOLDER_PREFIX}-param`,
        ].flatMap((folder) => [`${IF_DIRECTORY}/${folder}/${folder}.test.ts`, `${IF_DIRECTORY}/${folder}/${folder}.ts`]),
      ]);
    });
  });

  describe('an expression focus', () => {
    it('VALID: {focus: ternary, depth: 0} => plans the statement slot and the expression slot, in relPath order', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT, scenario: 'clean' });

      const result = specimensGenerateBroker({
        declarationsRoot: ROOT,
        args: GeneratorArgsStub({ mode: 'write', focus: ['ternary'], depth: 0 }),
      });

      expect(result.files.map(({ relPath }) => relPath)).toStrictEqual([
        'REFUSED.md',
        'specimen-manifest.json',
        ...[
          'ternary-boolean-function-declaration-body-cond-const',
          'ternary-boolean-function-declaration-body-cond-external',
          'ternary-boolean-function-declaration-body-cond-param',
          'ternary-boolean-function-declaration-default-param-cond-const',
          'ternary-boolean-function-declaration-default-param-cond-external',
          'ternary-boolean-function-declaration-default-param-cond-param',
          'ternary-number-function-declaration-body-cond-const',
          'ternary-number-function-declaration-body-cond-external',
          'ternary-number-function-declaration-body-cond-param',
          'ternary-number-function-declaration-default-param-cond-const',
          'ternary-number-function-declaration-default-param-cond-external',
          'ternary-number-function-declaration-default-param-cond-param',
        ].flatMap((folder) => [
          `src/ternary/function-declaration/${folder}/${folder}.test.ts`,
          `src/ternary/function-declaration/${folder}/${folder}.ts`,
        ]),
      ]);
    });

    it('VALID: {focus: ternary, slot: default-param, provenance: param} => writes the ternary as the parameter default, and a test that expects it driven both ways', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT });

      const result = specimensGenerateBroker({
        declarationsRoot: ROOT,
        args: GeneratorArgsStub({ mode: 'write', focus: ['ternary'], depth: 0 }),
      });

      expect(
        result.files.filter(({ relPath }) => relPath.includes('ternary-number-function-declaration-default-param-cond-param')),
      ).toStrictEqual([
        {
          relPath:
            'src/ternary/function-declaration/ternary-number-function-declaration-default-param-cond-param/ternary-number-function-declaration-default-param-cond-param.test.ts',
          content: [
            "import { join } from 'path';",
            '',
            "import { specimenObserveBroker } from '@assayer/specimen-generator/observe';",
            '',
            "describe('ternary-number-function-declaration-default-param-cond-param', () => {",
            "    it('VALID: {cond: param} => ternary on line 1 driven both ways, every case passes', async () => {",
            '        const observation = await specimenObserveBroker({',
            "            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),",
            "            relPath: 'packages/syntax-repository/src/ternary/function-declaration/ternary-number-function-declaration-default-param-cond-param/ternary-number-function-declaration-default-param-cond-param.ts'",
            '        });',
            '        expect(observation).toStrictEqual({',
            "            branches: [{ kind: 'ternary', line: 1, driven: 'both-ways' }],",
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
        },
        {
          relPath:
            'src/ternary/function-declaration/ternary-number-function-declaration-default-param-cond-param/ternary-number-function-declaration-default-param-cond-param.ts',
          content: [
            "export function ternaryNumberFunctionDeclarationDefaultParamCondParam(cond: number, label: string = cond ? 'then' : 'else'): string {",
            '    return label;',
            '}',
            '',
          ].join('\n'),
        },
      ]);
    });
  });

  describe('a specimen TypeScript rejects', () => {
    it('VALID: {container: unused-local} => lists each specimen as refused with its reason, and writes only the manifest and the refusals', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT, scenario: 'refusing' });

      const result = specimensGenerateBroker({
        declarationsRoot: ROOT,
        args: GeneratorArgsStub({ mode: 'write', focus: ['if'], container: ['unused-local'], depth: 0 }),
      });

      expect(result).toStrictEqual({
        files: [
          {
            relPath: 'REFUSED.md',
            content: [
              '# Specimens TypeScript refused',
              '',
              "The generator does not write a specimen that TypeScript rejects, and lists it here with TypeScript's reason.",
              '',
              "- `if-boolean-unused-local-cond-const`: 'unused' is declared but its value is never read.",
              "- `if-boolean-unused-local-cond-external`: 'unused' is declared but its value is never read.",
              "- `if-boolean-unused-local-cond-param`: 'unused' is declared but its value is never read.",
              "- `if-number-unused-local-cond-const`: 'unused' is declared but its value is never read.",
              "- `if-number-unused-local-cond-external`: 'unused' is declared but its value is never read.",
              "- `if-number-unused-local-cond-param`: 'unused' is declared but its value is never read.",
              '',
            ].join('\n'),
          },
          { relPath: 'specimen-manifest.json', content: '[]\n' },
        ],
        refused: [
          {
            folder: 'if-boolean-unused-local-cond-const',
            reason: "'unused' is declared but its value is never read.",
          },
          {
            folder: 'if-boolean-unused-local-cond-external',
            reason: "'unused' is declared but its value is never read.",
          },
          {
            folder: 'if-boolean-unused-local-cond-param',
            reason: "'unused' is declared but its value is never read.",
          },
          {
            folder: 'if-number-unused-local-cond-const',
            reason: "'unused' is declared but its value is never read.",
          },
          {
            folder: 'if-number-unused-local-cond-external',
            reason: "'unused' is declared but its value is never read.",
          },
          {
            folder: 'if-number-unused-local-cond-param',
            reason: "'unused' is declared but its value is never read.",
          },
        ],
        manifest: [],
      });
    });

    it('VALID: {focus: if, every container} => keeps the clean container and refuses the other, and each list stays sorted', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT, scenario: 'refusing' });

      const result = specimensGenerateBroker({
        declarationsRoot: ROOT,
        args: GeneratorArgsStub({ mode: 'write', focus: ['if'], depth: 0 }),
      });

      expect({
        refused: result.refused.map(({ folder }) => folder),
        manifest: result.manifest.map(({ folder }) => folder),
      }).toStrictEqual({
        refused: [
          'if-boolean-unused-local-cond-const',
          'if-boolean-unused-local-cond-external',
          'if-boolean-unused-local-cond-param',
          'if-number-unused-local-cond-const',
          'if-number-unused-local-cond-external',
          'if-number-unused-local-cond-param',
        ],
        manifest: [
          `${IF_BOOLEAN_PREFIX}-const`,
          `${IF_BOOLEAN_PREFIX}-external`,
          `${IF_BOOLEAN_PREFIX}-param`,
          `${IF_FOLDER_PREFIX}-const`,
          `${IF_FOLDER_PREFIX}-external`,
          `${IF_FOLDER_PREFIX}-param`,
        ],
      });
    });
  });

  describe('names the generator does not know', () => {
    it('ERROR: {focus: [nope]} => throws naming the focus and the known names', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT });

      expect(() =>
        specimensGenerateBroker({ declarationsRoot: ROOT, args: GeneratorArgsStub({ focus: ['nope'] }) }),
      ).toThrow(
        /^The focus 'nope' matches no syntax or shim declaration\. The known names are: gt, if, nullish, ternary\. Name one of them, or add declarations\/syntax\/nope\.syntax\.ts\.$/u,
      );
    });

    it('ERROR: {container: [nope]} => throws naming the container and the known names', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT });

      expect(() =>
        specimensGenerateBroker({
          declarationsRoot: ROOT,
          args: GeneratorArgsStub({ focus: ['if'], container: ['nope'] }),
        }),
      ).toThrow(
        /^The container 'nope' matches no container declaration\. The known names are: function-declaration\. Name one of them, or add declarations\/containers\/nope\.container\.ts\.$/u,
      );
    });
  });

  describe('two specimens with one folder name', () => {
    it('ERROR: {containers: x with slot y, x-y with one slot} => throws naming each shared folder', () => {
      const proxy = specimensGenerateBrokerProxy();
      proxy.setupTree({ declarationsRoot: ROOT, scenario: 'colliding' });

      expect(() =>
        specimensGenerateBroker({ declarationsRoot: ROOT, args: GeneratorArgsStub({ focus: ['if'], depth: 0 }) }),
      ).toThrow(
        /^Two specimens share one folder name: if-boolean-x-y-cond-const, if-boolean-x-y-cond-external, if-boolean-x-y-cond-param, if-number-x-y-cond-const, if-number-x-y-cond-external, if-number-x-y-cond-param\. Rename a container, slot or hole so the names differ, because the folder name is built from them\.$/u,
      );
    });
  });
});
