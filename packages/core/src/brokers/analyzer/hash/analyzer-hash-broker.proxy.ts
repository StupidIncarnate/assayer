import { registerMock } from '@dungeonmaster/testing/register-mock';
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const analyzerHashBrokerProxy = (): {
  walkReturns: ({ paths }: { paths: string[] }) => void;
  fileContent: ({ content }: { content: string }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
  // the like) propagates to the caller unmodified. This stages that rejection.
  readThrows: ({ error }: { error: Error }) => void;
} => {
  compileWalkWorkingTreeBrokerProxy();
  fsReadFileAdapterProxy();
  pathRelativeAdapterProxy();
  cryptoSha256AdapterProxy();

  const walkHandle = registerMock({ fn: compileWalkWorkingTreeBroker });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  // Stays on the legacy per-adapter-routed fallback so the proxy constructor stays free of the
  // argument-matching side effects `walkReturns`/`fileContent` below add per test.
  walkHandle.calledWith([]).resolves([]);
  readHandle.calledWith([]).resolves('');

  return {
    // `calledWith([])` (not `onceFor`) on purpose: the determinism test stages one value and expects
    // TWO separate broker invocations to both read it back, so the staging has to survive being
    // consumed more than once. The "before/after" test still works under this same sticky staging — a
    // later `calledWith([])` call always outranks an earlier one at equal specificity, so restaging
    // before the second invocation still swaps the answer cleanly.
    walkReturns: ({ paths }: { paths: string[] }): void => {
      walkHandle.calledWith([]).resolves(paths.map((path) => FilePathStub({ value: path })));
    },
    fileContent: ({ content }: { content: string }): void => {
      readHandle.calledWith([]).resolves(content);
    },
    // A true one-shot: the error case reads exactly one file, so there is nothing after it that
    // should ALSO see the rejection.
    readThrows: ({ error }: { error: Error }): void => {
      readHandle.onceFor([]).rejects(error);
    },
  };
};
