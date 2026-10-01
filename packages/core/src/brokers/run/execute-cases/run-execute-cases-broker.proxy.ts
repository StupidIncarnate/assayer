import { runCLI } from '#gateway/npm/jest__core';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { testPathPatternTransformer } from '../../../transformers/test-path-pattern/test-path-pattern-transformer';

export const runExecuteCasesBrokerProxy = (): {
  succeeds: ({ runDir }: { runDir: string }) => void;
  fails: ({ runDir }: { runDir: string }) => void;
  configFor: ({ testPathPattern }: { testPathPattern: string }) => unknown;
  getTestPathPatterns: () => unknown[];
  wasInvoked: () => boolean;
} => {
  const handle = registerMock({ fn: runCLI });

  return {
    // A run is addressed on the argv's positionals, the one part of the call that names which run is
    // executing. A run directory no scenario staged reaches an unstaged call, which throws.
    succeeds: ({ runDir }: { runDir: string }): void => {
      handle
        .calledWith([{ _: [String(testPathPatternTransformer({ runDir }))] }])
        .resolves({ results: { success: true } });
    },
    fails: ({ runDir }: { runDir: string }): void => {
      handle
        .calledWith([{ _: [String(testPathPatternTransformer({ runDir }))] }])
        .resolves({ results: { success: false } });
    },
    // Addressed on the argv's positionals, so a test driving two runs reads each run's own config
    // rather than whichever ran last. That is what makes the identical-config assertion mean anything.
    configFor: ({ testPathPattern }: { testPathPattern: string }): unknown => {
      const argv = handle.callsMatching([{ _: [testPathPattern] }]).at(-1)?.[0];

      return typeof argv === 'object' && argv !== null && 'config' in argv ? argv.config : undefined;
    },
    // yargs' positionals, which is where Jest reads its test-path patterns from — the one place the
    // run being executed is named, so that the config above can stay identical between runs. One
    // entry per runCLI call, in call order: a test asserting WHICH pattern was used cannot address
    // the read by that pattern without asking the question it is trying to answer.
    getTestPathPatterns: (): unknown[] =>
      handle.callsMatching([]).map((call) => {
        const [argv] = call;

        return typeof argv === 'object' && argv !== null && '_' in argv ? argv._ : undefined;
      }),
    wasInvoked: (): boolean => handle.callsMatching([]).length > 0,
  };
};
