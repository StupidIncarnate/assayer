import { createRequire } from 'module';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import * as resolveModulePathModule from './resolve-module-path';

// The wrapper's own module is the seam a caller's test stages, addressed by the exact specifier and
// the exact file the walk starts from. A spy on the module object, not a mock of the module: the
// barrel re-exports `resolveModulePath` through a getter that reads this object at call time, so a
// caller reaches the spy however it imported the function. A call that matches no staging throws, so
// a caller that resolves a different specifier, or from a different file, fails its test. The
// colocated test drives the real wrapper without this proxy.
export const resolveModulePathProxy = (): {
  returns: (params: { specifier: string; fromPath: string; path: string }) => void;
  resolvesReal: (params: { specifier: string; fromPath: string }) => void;
  getCallsFor: (params: { specifier: string; fromPath: string }) => readonly unknown[][];
} => {
  const handle = registerSpyOn({ object: resolveModulePathModule, method: 'resolveModulePath' });

  return {
    returns: ({
      specifier,
      fromPath,
      path,
    }: {
      specifier: string;
      fromPath: string;
      path: string;
    }): void => {
      handle.calledWith([{ specifier, fromPath }]).returns(path);
    },
    // A REAL resolution of exactly this specifier from exactly this file. A specifier nothing
    // provides then throws Node's own MODULE_NOT_FOUND error, so a caller's failure path gets the
    // error Node really produces.
    resolvesReal: ({ specifier, fromPath }: { specifier: string; fromPath: string }): void => {
      handle.calledWith([{ specifier, fromPath }]).implement((): string => {
        const resolvedPath: string = createRequire(fromPath).resolve(specifier);

        return resolvedPath;
      });
    },
    getCallsFor: ({
      specifier,
      fromPath,
    }: {
      specifier: string;
      fromPath: string;
    }): readonly unknown[][] => handle.callsMatching([{ specifier, fromPath }]),
  };
};
