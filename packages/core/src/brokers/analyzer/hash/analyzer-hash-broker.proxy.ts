import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { findUpSyncProxy } from '#gateway/node/fs/find-up-sync/find-up-sync.proxy';
import { readJsonFileSyncProxy } from '#gateway/node/fs/read-json-file-sync/read-json-file-sync.proxy';
import { realpathSyncProxy } from '#gateway/node/fs/realpath-sync/realpath-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { extname, join } from '#gateway/node/path';
import { coreRuntimeTransformer } from '../../../transformers/core-runtime/core-runtime-transformer';
import { coreRuntimeStatics } from '../../../statics/core-runtime/core-runtime-statics';

export const analyzerHashBrokerProxy = (): {
  dirHolds: ({
    path,
    entries,
  }: {
    path: string;
    entries: readonly { name: string; kind: 'file' | 'directory' }[];
  }) => void;
  fileContent: ({ path, content }: { path: string; content: string }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
  // the like) propagates to the caller unmodified. This stages an EACCES rejection for one path.
  readDenied: ({ path }: { path: string }) => void;
  tsMorphInstalled: ({
    from,
    gatewayInstallDir,
    gatewayDir,
    tsMorphInstallDir,
    version,
  }: {
    from: string;
    gatewayInstallDir: string;
    gatewayDir: string;
    tsMorphInstallDir: string;
    version: string;
  }) => void;
  gatewayNotInstalledAbove: ({ from }: { from: string }) => void;
  tsMorphNotInstalledAbove: ({ from, gatewayDir }: { from: string; gatewayDir: string }) => void;
  tsMorphAboveThisModule: ({ version }: { version: string }) => void;
  coreRuntimeAt: ({ from, coreRoot, content }: { from: string; coreRoot: string; content: string }) => void;
  coreRuntimeAboveThisModule: ({ content }: { content: string }) => void;
  coreRootNotFoundAbove: ({ from }: { from: string }) => void;
} => {
  // The walk runs real. Each directory it reads is staged by its exact path, so a directory no
  // scenario staged reaches an unstaged read, which throws.
  const walkProxy = compileWalkWorkingTreeBrokerProxy();
  const readFileGateway = readFileProxy();
  const findUpProxy = findUpSyncProxy();
  const realpathProxy = realpathSyncProxy();
  const readJsonProxy = readJsonFileSyncProxy();

  // Every directory from `from` up to `top`, inclusive, deepest first.
  const directoriesUpTo = ({ from, top }: { from: string; top: string }): string[] => {
    const segments = from.split('/');
    return segments
      .map((_segment, index) => segments.slice(0, index + 1).join('/'))
      .map((directory) => (directory === '' ? '/' : directory))
      .filter((directory) => directory.length >= top.length)
      .reverse();
  };

  // @assayer/npm's manifest is found first in `gatewayInstallDir/node_modules` and resolves through
  // realpath to `gatewayDir`. From there ts-morph's manifest is found first in
  // `tsMorphInstallDir/node_modules`, and it names `version`. Every probe is staged by its exact path.
  const tsMorphInstalled = ({
    from,
    gatewayInstallDir,
    gatewayDir,
    tsMorphInstallDir,
    version,
  }: {
    from: string;
    gatewayInstallDir: string;
    gatewayDir: string;
    tsMorphInstallDir: string;
    version: string;
  }): void => {
    directoriesUpTo({ from, top: gatewayInstallDir }).forEach((directory) => {
      (directory === gatewayInstallDir ? findUpProxy.foundAt : findUpProxy.notFound)({
        path: join(directory, 'node_modules', '@assayer', 'npm', 'package.json'),
      });
    });
    realpathProxy.returns({ path: join(gatewayInstallDir, 'node_modules', '@assayer', 'npm'), resolved: gatewayDir });
    directoriesUpTo({ from: gatewayDir, top: tsMorphInstallDir }).forEach((directory) => {
      (directory === tsMorphInstallDir ? findUpProxy.foundAt : findUpProxy.notFound)({
        path: join(directory, 'node_modules', 'ts-morph', 'package.json'),
      });
    });
    readJsonProxy.returns({
      path: join(tsMorphInstallDir, 'node_modules', 'ts-morph', 'package.json'),
      json: JSON.stringify({ name: 'ts-morph', version }),
    });
  };

  // The runner's setup file is missing from every directory from `from` down to below `coreRoot`, and
  // present in `coreRoot`. Every file the run loads by path then reads as `content`. A test changes
  // one of them afterwards with `fileContent`.
  const coreRuntimeAt = ({ from, coreRoot, content }: { from: string; coreRoot: string; content: string }): void => {
    const { setupFile } = coreRuntimeStatics.ceremony;
    directoriesUpTo({ from, top: coreRoot }).forEach((directory) => {
      (directory === coreRoot ? findUpProxy.foundAt : findUpProxy.notFound)({ path: join(directory, setupFile) });
    });
    const { tree, ...runtimePaths } = coreRuntimeTransformer({ coreRoot, loadedFrom: from });
    const moduleExtension = tree === 'dist' ? '.js' : '.ts';
    Object.values(runtimePaths).forEach((path) => {
      readFileGateway.returns({ path: extname(path) === '' ? `${path}${moduleExtension}` : path, contents: content });
    });
  };

  return {
    coreRuntimeAt,
    // The broker's default start is its own directory, which is this proxy's directory too. Core's
    // package root sits four levels above it: hash, analyzer, brokers, src.
    coreRuntimeAboveThisModule: ({ content }: { content: string }): void => {
      coreRuntimeAt({ from: __dirname, coreRoot: join(__dirname, '..', '..', '..', '..'), content });
    },
    // No directory from `from` up to the filesystem root holds the runner's setup file.
    coreRootNotFoundAbove: ({ from }: { from: string }): void => {
      directoriesUpTo({ from, top: '/' }).forEach((directory) => {
        findUpProxy.notFound({ path: join(directory, coreRuntimeStatics.ceremony.setupFile) });
      });
    },
    // Restaging a directory replaces its entries for every later walk, so one test can walk the
    // same root twice and see different files.
    dirHolds: ({
      path,
      entries,
    }: {
      path: string;
      entries: readonly { name: string; kind: 'file' | 'directory' }[];
    }): void => {
      walkProxy.queueDir({ path, entries });
    },
    fileContent: ({ path, content }: { path: string; content: string }): void => {
      readFileGateway.returns({ path, contents: content });
    },
    readDenied: ({ path }: { path: string }): void => {
      readFileGateway.denied({ path });
    },
    tsMorphInstalled,
    // No directory from `from` up to the filesystem root holds @assayer/npm.
    gatewayNotInstalledAbove: ({ from }: { from: string }): void => {
      directoriesUpTo({ from, top: '/' }).forEach((directory) => {
        findUpProxy.notFound({
          path: join(directory, 'node_modules', '@assayer', 'npm', 'package.json'),
        });
      });
    },
    // @assayer/npm sits in `from/node_modules` and resolves to `gatewayDir`, but no directory from
    // `gatewayDir` up to the filesystem root holds ts-morph.
    tsMorphNotInstalledAbove: ({ from, gatewayDir }: { from: string; gatewayDir: string }): void => {
      findUpProxy.foundAt({ path: join(from, 'node_modules', '@assayer', 'npm', 'package.json') });
      realpathProxy.returns({ path: join(from, 'node_modules', '@assayer', 'npm'), resolved: gatewayDir });
      directoriesUpTo({ from: gatewayDir, top: '/' }).forEach((directory) => {
        findUpProxy.notFound({ path: join(directory, 'node_modules', 'ts-morph', 'package.json') });
      });
    },
    // The broker's default start is its own directory, which is this proxy's directory too. The
    // monorepo root sits six levels above it: hash, analyzer, brokers, src, core, packages. Its
    // `node_modules` links @assayer/npm to the gateway's workspace folder, and holds ts-morph.
    tsMorphAboveThisModule: ({ version }: { version: string }): void => {
      const monorepoRoot = join(__dirname, '..', '..', '..', '..', '..', '..');
      tsMorphInstalled({
        from: __dirname,
        gatewayInstallDir: monorepoRoot,
        gatewayDir: join(monorepoRoot, 'packages', '@gateway', 'npm'),
        tsMorphInstallDir: monorepoRoot,
        version,
      });
    },
  };
};
