import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { runIdBrokerProxy } from '../id/run-id-broker.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// The broker reads TWO files through one pair of adapters — the source (to derive the content-keyed
// run id) and then console.txt. The report path always CONTAINS `console.txt`; the source (and the
// colocated-harness check inside runIdBroker) never does. Matching on that substring, rather than on
// which read happens first, is what keeps a source-content stub from silently answering a report read
// (or the reverse) if the broker's own read order ever changes. The adapters are mocked rather than
// fs/promises underneath them because a second mock of `readFile` registered from here would answer
// calls this broker's OWN direct mock of `fsReadFileAdapter` already claims.
const isReportPath = (path: unknown): boolean => typeof path === 'string' && path.includes('console.txt');
// runIdBroker checks for a colocated harness before this broker ever asks for the report. None of this
// proxy's scenarios exercise a harness, so that check is answered false here — a real path, matched
// explicitly, rather than a spurious third read riding the same blanket default the source and report
// share.
const isHarnessPath = (path: unknown): boolean => typeof path === 'string' && path.endsWith('.harness.ts');

export const runConsoleFindBrokerProxy = (): {
  savedConsole: ({ console }: { console: string }) => void;
  neverRun: () => void;
  fileMissing: () => void;
  sourceReadThrows: ({ error }: { error: Error }) => void;
  consoleReadThrows: ({ error }: { error: Error }) => void;
  getReadArgs: () => readonly unknown[];
} => {
  pathExistsProxy();
  readFileProxy();
  runIdBrokerProxy();

  const existsHandle = registerMock({ fn: fsExistsAdapter });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  existsHandle.calledWith([]).resolves(true);
  existsHandle.calledWith([{ path: isHarnessPath }]).resolves(false);
  readHandle.calledWith([]).resolves('export const a = 1;\n');

  return {
    savedConsole: ({ console: consoleText }: { console: string }): void => {
      readHandle.calledWith([{ path: isReportPath }]).resolves(consoleText);
    },
    neverRun: (): void => {
      existsHandle.calledWith([{ path: isReportPath }]).resolves(false);
    },
    fileMissing: (): void => {
      existsHandle.calledWith([]).resolves(false);
    },
    // Both reads are deliberately unwrapped -- no try/catch -- so a filesystem rejection propagates to
    // the caller unmodified. The source read is whichever read happens first; the report read is
    // whichever read names the console.txt path, regardless of order.
    sourceReadThrows: ({ error }: { error: Error }): void => {
      readHandle.onceFor([]).rejects(error);
    },
    consoleReadThrows: ({ error }: { error: Error }): void => {
      readHandle.calledWith([{ path: isReportPath }]).rejects(error);
    },
    // Serialized rather than destructured: reading `.path` off a mock argument needs an inline
    // structural type, which brokers/ forbids. The JSON is exact and needs no assertion.
    getReadArgs: (): readonly unknown[] => readHandle.callsMatching([]).map((call) => JSON.stringify(call[0])),
  };
};
