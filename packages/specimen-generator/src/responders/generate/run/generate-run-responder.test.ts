import { GenerateRunResponder } from './generate-run-responder';
import { GenerateRunResponderProxy } from './generate-run-responder.proxy';

const REPO_ROOT = '/virtual/repo';
const ACCEPTED = 'Accepted flags: --check, --focus=<a,b>, --container=<a,b>, --depth=<whole number, 0 or more>.';

describe('GenerateRunResponder', () => {
  describe('refused arguments', () => {
    it.each([
      '--bogus',
      'positional',
      '--focus=',
      '--focus=a,,b',
      '--container=',
      '--depth=',
      '--depth=-1',
      '--depth=1.5',
      '--depth=two',
      '--check=1',
    ])('INVALID: {argv: [%s]} => exit 1 naming the argument and listing the accepted flags', (arg) => {
      GenerateRunResponderProxy();

      const result = GenerateRunResponder({ argv: [arg], repoRoot: REPO_ROOT });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: `specimen-generator: cannot read the argument "${arg}". It is not an accepted flag, or its value is malformed. ${ACCEPTED}`,
      });
    });

    it('INVALID: {argv: [--check, --bogus]} => exit 1, since one unknown argument refuses the whole command', () => {
      GenerateRunResponderProxy();

      const result = GenerateRunResponder({ argv: ['--check', '--bogus'], repoRoot: REPO_ROOT });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: `specimen-generator: cannot read the argument "--bogus". It is not an accepted flag, or its value is malformed. ${ACCEPTED}`,
      });
    });
  });

  describe('check mode with a narrowed run', () => {
    it.each(['--focus=if', '--container=function-declaration', '--depth=0'])(
      'INVALID: {argv: [--check, %s]} => exit 1 explaining that check compares the full matrix',
      (narrowing) => {
        GenerateRunResponderProxy();

        const result = GenerateRunResponder({ argv: ['--check', narrowing], repoRoot: REPO_ROOT });

        expect(result).toStrictEqual({
          exitCode: 1,
          output:
            'specimen-generator: --check always compares the full default matrix, so it cannot be combined with --focus, --container or --depth. A narrowed run would report every file it skipped as extra. Run --check with no other flag.',
        });
      },
    );
  });

  describe('a failure while generating', () => {
    it('ERROR: {argv: [--focus=nope]} => exit 1 with the generator message naming nope', () => {
      const proxy = GenerateRunResponderProxy();
      proxy.setupDeclarations({ repoRoot: REPO_ROOT });

      const result = GenerateRunResponder({ argv: ['--focus=nope'], repoRoot: REPO_ROOT });

      expect(result).toStrictEqual({
        exitCode: 1,
        output:
          "The focus 'nope' matches no syntax or shim declaration. The known names are: gt, if, nullish, ternary. Name one of them, or add declarations/syntax/nope.syntax.ts.",
      });
    });

    it('ERROR: {argv: [--container=nope]} => exit 1 with the generator message naming nope', () => {
      const proxy = GenerateRunResponderProxy();
      proxy.setupDeclarations({ repoRoot: REPO_ROOT });

      const result = GenerateRunResponder({ argv: ['--container=nope'], repoRoot: REPO_ROOT });

      expect(result).toStrictEqual({
        exitCode: 1,
        output:
          "The container 'nope' matches no container declaration. The known names are: function-declaration. Name one of them, or add declarations/containers/nope.container.ts.",
      });
    });
  });
});
