import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  succeeds: () => void;
  throws: ({ error }: { error: Error }) => void;
  // Every path written, in call order. A test asserting WHICH path a broker wrote cannot address the
  // read by that path without asking the question it is trying to answer, so it reads the whole list
  // and asserts it complete. That is a stronger assertion than "whatever ran last" anyway: an extra
  // write nobody expected fails it.
  getWrittenPaths: () => unknown[];
  // Answers for the asked-for path only.
  getWrittenContentFor: ({ path }: { path: string }) => unknown;
  // Answers for the LAST call whose path contains the substring — a caller that writes several files
  // (a run directory's cases.json, probe plans, and the generated shim, in that order) needs a way to
  // reach an earlier one, and a run directory's own name is not known to the test up front.
  getWrittenContentMatching: ({ pathIncludes }: { pathIncludes: string }) => unknown;
  wasCalled: () => boolean;
} => {
  const handle = registerMock({ fn: writeFile });

  handle.calledWith([]).resolves(undefined);

  return {
    succeeds: (): void => {
      handle.onceFor([]).resolves(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.onceFor([]).rejects(error);
    },
    getWrittenPaths: (): unknown[] => handle.callsMatching([]).map((call) => call[0]),
    getWrittenContentFor: ({ path }: { path: string }): unknown =>
      handle.callsMatching([path]).at(-1)?.[1],
    getWrittenContentMatching: ({ pathIncludes }: { pathIncludes: string }): unknown =>
      handle
        .callsMatching([(value: unknown): boolean => String(value).includes(pathIncludes)])
        .at(-1)?.[1],
    wasCalled: (): boolean => handle.callsMatching([]).length > 0,
  };
};
