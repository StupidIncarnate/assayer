/**
 * PURPOSE: Runs the generator command. It reads argv, refuses any argument it does not read before
 * anything runs, then generates in memory and either writes the result into smoke-repo (default) or
 * compares it with the committed files (`--check`). A failure while generating, such as a `--focus`
 * naming no declaration, becomes exit code 1 with the failure's own message.
 *
 * Check mode always compares the full default matrix. A narrowed run would report every file it
 * skipped as extra, so `--check` refuses `--focus`, `--container` and `--depth`.
 *
 * USAGE:
 * GenerateRunResponder({ argv: ['--check'], repoRoot: '/repo' });
 * // Returns { exitCode: 0, output: 'smoke-repo is current: 297 specimens' } when nothing drifted
 */
import { join, relative } from '#gateway/node/path';

import { specimensCheckBroker } from '../../../brokers/specimens/check/specimens-check-broker';
import { specimensGenerateBroker } from '../../../brokers/specimens/generate/specimens-generate-broker';
import { specimensWriteBroker } from '../../../brokers/specimens/write/specimens-write-broker';
import { generatorArgsContract } from '../../../contracts/generator-args/generator-args-contract';
import { generateRunResultContract } from '../../../contracts/generate-run-result/generate-run-result-contract';
import type { GenerateRunResult } from '../../../contracts/generate-run-result/generate-run-result-contract';
import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';

const checkFlag = '--check';
const focusPrefix = '--focus=';
const containerPrefix = '--container=';
const depthPrefix = '--depth=';
const digits = '0123456789';
const acceptedFlags = '--check, --focus=<a,b>, --container=<a,b>, --depth=<whole number, 0 or more>';
const packageFolder = 'specimen-generator';

export const GenerateRunResponder = ({
  argv,
  repoRoot,
}: {
  argv: readonly string[];
  repoRoot: string;
}): GenerateRunResult => {
  const refused = argv.find((arg) => {
    if (arg === checkFlag) {
      return false;
    }
    if (arg.startsWith(focusPrefix)) {
      return arg
        .slice(focusPrefix.length)
        .split(',')
        .some((name) => name === '');
    }
    if (arg.startsWith(containerPrefix)) {
      return arg
        .slice(containerPrefix.length)
        .split(',')
        .some((name) => name === '');
    }
    if (arg.startsWith(depthPrefix)) {
      const value = arg.slice(depthPrefix.length);
      return value === '' || Array.from(value).some((char) => !digits.includes(char));
    }
    return true;
  });
  if (refused !== undefined) {
    return generateRunResultContract.parse({
      exitCode: 1,
      output: `specimen-generator: cannot read the argument "${refused}". It is not an accepted flag, or its value is malformed. Accepted flags: ${acceptedFlags}.`,
    });
  }

  const focusArg = argv.find((arg) => arg.startsWith(focusPrefix));
  const containerArg = argv.find((arg) => arg.startsWith(containerPrefix));
  const depthArg = argv.find((arg) => arg.startsWith(depthPrefix));
  const args = generatorArgsContract.parse({
    mode: argv.includes(checkFlag) ? 'check' : 'write',
    ...(focusArg === undefined ? {} : { focus: focusArg.slice(focusPrefix.length).split(',') }),
    ...(containerArg === undefined ? {} : { container: containerArg.slice(containerPrefix.length).split(',') }),
    ...(depthArg === undefined ? {} : { depth: Number(depthArg.slice(depthPrefix.length)) }),
  });

  if (args.mode === 'check' && (focusArg !== undefined || containerArg !== undefined || depthArg !== undefined)) {
    return generateRunResultContract.parse({
      exitCode: 1,
      output:
        'specimen-generator: --check always compares the full default matrix, so it cannot be combined with --focus, --container or --depth. A narrowed run would report every file it skipped as extra. Run --check with no other flag.',
    });
  }

  const declarationsRoot = join(repoRoot, 'packages', packageFolder, generatorLayoutStatics.declarations.folder);
  const outRoot = join(repoRoot, ...generatorLayoutStatics.output.rootSegments);

  try {
    const generated = specimensGenerateBroker({ declarationsRoot, args });

    if (args.mode === 'write') {
      specimensWriteBroker({ outRoot, result: generated });
      return generateRunResultContract.parse({
        exitCode: 0,
        output: `generated ${generated.manifest.length} specimens into ${relative(repoRoot, outRoot)}; TypeScript refused ${generated.refused.length}`,
      });
    }

    const drift = specimensCheckBroker({ outRoot, result: generated });
    if (drift.length === 0) {
      return generateRunResultContract.parse({
        exitCode: 0,
        output: `smoke-repo is current: ${generated.manifest.length} specimens`,
      });
    }

    return generateRunResultContract.parse({
      exitCode: 1,
      output: [
        ...drift.map((entry) => `${entry.problem}: ${entry.relPath}`),
        'run npm run generate:specimens to regenerate',
      ].join('\n'),
    });
  } catch (error: unknown) {
    return generateRunResultContract.parse({
      exitCode: 1,
      output: error instanceof Error ? error.message : String(error),
    });
  }
};
