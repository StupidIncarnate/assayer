import { readFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// A source read always targets a plain repo file, never the `.assayer/cache` tree — the pattern that
// tells this adapter's calls apart from every other proxy sharing the same readFile mock (a cache
// blob, stub-index, resolved-index, or manifest read, which all live under `.assayer/cache`). Matching
// by shape instead of by exact path means this proxy needs no test to say which file it is reading.
const isSourcePath = (value: unknown): boolean =>
  typeof value === 'string' && !value.includes('/.assayer/cache/');

export const nodeFsReadSourceAdapterProxy = (): {
  returns: ({ content }: { content: string }) => void;
  missing: () => void;
} => {
  const handle = registerMock({ fn: readFile });

  // Default: a trivially parseable source, so a broker that reads-then-walks succeeds without a test
  // wiring anything. Matched on the source path (not a blanket `calledWith([])`) because `readFile` is
  // shared across every proxy that mocks it — a blob, manifest, resolved-index, or stub-index read
  // registers against the SAME underlying mock when more than one proxy is live in one test, and a
  // blanket default here would answer a call this proxy was never meant to serve.
  handle.calledWith([isSourcePath]).resolves('export const x = 1;\n');

  return {
    returns: ({ content }: { content: string }): void => {
      handle.onceFor([isSourcePath]).resolves(content);
    },
    missing: (): void => {
      handle.onceFor([isSourcePath]).rejects(new Error('ENOENT: no such file or directory'));
    },
  };
};
