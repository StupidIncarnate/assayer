import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  succeeds: () => void;
  throws: ({ error }: { error: Error }) => void;
  getWrittenPath: () => unknown;
  getWrittenContent: () => unknown;
  // Finds the LAST call whose path contains the substring — a caller that writes several files (a run
  // directory's cases.json, probe plans, and the generated shim, in that order) needs one that is not
  // simply "the most recent write" to inspect an earlier one.
  getWrittenContentFor: ({ pathIncludes }: { pathIncludes: string }) => unknown;
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
    getWrittenPath: (): unknown => handle.callsMatching([]).at(-1)?.[0],
    getWrittenContent: (): unknown => handle.callsMatching([]).at(-1)?.[1],
    getWrittenContentFor: ({ pathIncludes }: { pathIncludes: string }): unknown =>
      handle.callsMatching([]).filter((call) => String(call[0]).includes(pathIncludes)).at(-1)?.[1],
    wasCalled: (): boolean => handle.callsMatching([]).length > 0,
  };
};
