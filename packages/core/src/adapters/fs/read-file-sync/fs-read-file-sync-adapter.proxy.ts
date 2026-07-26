import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileSyncAdapterProxy = (): {
  // `path` is optional so a caller reading a single file keeps the old "next call" shorthand, and a
  // caller reading several distinct files (e.g. resolving more than one sibling in one test) can name
  // which path each queued content answers, instead of relying on the order the code happens to read
  // them in.
  returns: ({ content, path }: { content: string; path?: string }) => void;
  throws: ({ error, path }: { error: Error; path?: string }) => void;
} => {
  const handle = registerMock({ fn: readFileSync });

  // Stays on the legacy per-adapter-routed fallback so the proxy constructor stays free of the
  // argument-matching side effects `.returns()`/`.throws()` below add per test.
  handle.calledWith([]).returns('');

  return {
    returns: ({ content, path }: { content: string; path?: string }): void => {
      handle.onceFor(path === undefined ? [] : [path]).returns(content);
    },
    throws: ({ error, path }: { error: Error; path?: string }): void => {
      handle.onceFor(path === undefined ? [] : [path]).throws(error);
    },
  };
};
