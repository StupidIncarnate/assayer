import { runCLI } from '@jest/core';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const runExecuteCasesBrokerProxy = (): {
  succeeds: () => void;
  fails: () => void;
  configFor: ({ testPathPattern }: { testPathPattern: string }) => unknown;
  getTestPathPatterns: () => unknown[];
  wasInvoked: () => boolean;
} => {
  const handle = registerMock({ fn: runCLI });
  handle.calledWith([]).resolves({ results: { success: true } });

  return {
    succeeds: (): void => { handle.onceFor([]).resolves({ results: { success: true } }); },
    fails: (): void => { handle.onceFor([]).resolves({ results: { success: false } }); },
    // Addressed on the argv's positionals, the one part of the call that differs between runs, so a
    // test driving two runs reads each run's own config rather than whichever ran last. That is what
    // makes the identical-config assertion below mean anything.
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
