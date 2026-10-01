import { registerMock } from '@dungeonmaster/testing/register-mock';
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { contentHashTransformerProxy } from '../../../transformers/content-hash/content-hash-transformer.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const analyzerHashBrokerProxy = (): {
  walkReturns: ({ paths }: { paths: string[] }) => void;
  fileContent: ({ path, content }: { path: string; content: string }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
  // the like) propagates to the caller unmodified. This stages an EACCES rejection for one path.
  readDenied: ({ path }: { path: string }) => void;
} => {
  compileWalkWorkingTreeBrokerProxy();
  const readFileGateway = readFileProxy();
  contentHashTransformerProxy();

  const walkHandle = registerMock({ fn: compileWalkWorkingTreeBroker });

  // Stays on the legacy per-adapter-routed fallback so the proxy constructor stays free of the
  // argument-matching side effects `walkReturns` below adds per test.
  walkHandle.calledWith([]).resolves([]);

  return {
    // `calledWith([])` (not `onceFor`) on purpose: the determinism test stages one value and expects
    // TWO separate broker invocations to both read it back, so the staging has to survive being
    // consumed more than once. The "before/after" test still works under this same sticky staging — a
    // later `calledWith([])` call always outranks an earlier one at equal specificity, so restaging
    // before the second invocation still swaps the answer cleanly.
    walkReturns: ({ paths }: { paths: string[] }): void => {
      walkHandle.calledWith([]).resolves(paths.map((path) => FilePathStub({ value: path })));
    },
    fileContent: ({ path, content }: { path: string; content: string }): void => {
      readFileGateway.returns({ path, contents: content });
    },
    readDenied: ({ path }: { path: string }): void => {
      readFileGateway.denied({ path });
    },
  };
};
