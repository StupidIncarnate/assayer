/**
 * PURPOSE: Drives the compile pipeline end-to-end through the REAL assayer CLI entry, run from
 *   source (packages/cli/bin/assayer.ts through tsx, with every workspace package resolved to its
 *   TypeScript source through the `source` export condition), so no build is needed first. It runs
 *   against a fresh, hermetic temp working directory OUTSIDE the repo per test (created in
 *   beforeEach, removed in afterEach) so config-lookup walks up to nothing. Beyond spawning the CLI, it can turn the temp dir into a real (hermetic) git repo —
 *   committing a baseline on a work branch and creating a `master` branch pointer WITHOUT ever
 *   checking out — so the stable-namespace (git blobs) and current-namespace (working tree) caches
 *   are both exercised. It reads back the written .assayer/cache manifest + content-addressed blobs
 *   so a colocated .integration.test.ts asserts on the compiled surface (namespaces, per-file
 *   content hashes, reconstructed source, blob reuse) without touching node builtins itself. Owns
 *   all node:fs / node:child_process access.
 *
 * USAGE:
 * const compile = assayerCompileHarness();
 * // beforeEach makes a fresh temp cwd; afterEach removes it (auto-wired by the harness transformer)
 * compile.writeConfig({ json: '{"repoRoot":".","exclude":[]}' });
 * compile.writeSource({ relPath: 'src/a.ts', source: 'export const a = (): number => 1;\n' });
 * await compile.run({ argv: ['status'] });
 * compile.manifestRelPaths({ namespace: 'default' }); // => ['src/a.ts']
 */
import { join, dirname } from '#gateway/node/path';
import { spawn } from '#gateway/node/child_process';
import { gitRun, currentBranch } from '#gateway/bin/git';
import { tmpdir } from '#gateway/node/os';
import {
  mkdtempSync,
  ensureDirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
} from '#gateway/node/fs';

import { CliRunResultStub } from '../../src/contracts/cli-run-result/cli-run-result.stub';
import type { CliRunResult } from '../../src/contracts/cli-run-result/cli-run-result-contract';
import { ContentHashStub } from '@assayer/shared/contracts/content-hash/content-hash.stub';
import type { ContentHash } from '@assayer/shared/contracts';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import type { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';
import { execPath } from '#gateway/node/process';
import { tsxLoaderUrl } from '#gateway/npm/tsx';

// `--conditions=source` resolves every workspace package to its TypeScript source, the way ward's own
// checks do. It goes on node itself, beside `--import`, because tsx's CLI would start a second
// process that does not inherit it.
const cliArgs = [
  '--conditions=source',
  '--import',
  tsxLoaderUrl(),
  join(__dirname, '..', '..', 'bin', 'assayer.ts'),
];

type Manifest = ReturnType<typeof AssayerCacheManifestStub>;
type Blob = ReturnType<typeof CompiledFileBlobStub>;

export const assayerCompileHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  writeConfig: ({ json }: { json: string }) => void;
  writeSource: ({ relPath, source }: { relPath: string; source: string }) => void;
  removeCache: () => void;
  run: ({ argv }: { argv: readonly string[] }) => Promise<CliRunResult>;
  seedGitBaseline: ({
    workBranch,
    stableBranch,
    sources,
    message,
  }: {
    workBranch: string;
    stableBranch: string;
    sources: readonly { relPath: string; source: string }[];
    message: string;
  }) => Promise<void>;
  headBranch: () => Promise<string>;
  read: ({ relPath }: { relPath: string }) => string;
  exists: ({ relPath }: { relPath: string }) => boolean;
  manifestNamespaceNames: () => readonly string[];
  manifestRelPaths: ({ namespace }: { namespace: string }) => readonly string[];
  manifestContentHash: ({ namespace, relPath }: { namespace: string; relPath: string }) => ContentHash;
  manifestNamespaceHasCommit: ({ namespace }: { namespace: string }) => boolean;
  blobHashes: () => readonly ContentHash[];
  readBlobText: ({ hash }: { hash: string }) => string;
  blobSourceText: ({ namespace, relPath }: { namespace: string; relPath: string }) => string;
  concatAllBlobs: () => string;
} => {
  let dir = '';

  return {
    beforeEach: (): void => {
      dir = mkdtempSync(join(tmpdir(), 'assayer-compile-'));
    },
    afterEach: (): void => {
      rmSync(dir, { recursive: true, force: true });
    },
    writeConfig: ({ json }: { json: string }): void => {
      writeFileSync(join(dir, 'assayer.config.json'), json);
    },
    writeSource: ({ relPath, source }: { relPath: string; source: string }): void => {
      const target = join(dir, relPath);
      ensureDirSync(dirname(target));
      writeFileSync(target, source);
    },
    removeCache: (): void => {
      rmSync(join(dir, '.assayer'), { recursive: true, force: true });
    },
    run: async ({ argv }: { argv: readonly string[] }): Promise<CliRunResult> =>
      new Promise((resolve: (result: CliRunResult) => void, reject: (error: Error) => void) => {
        const child = spawn(execPath, [...cliArgs, ...argv], {
          cwd: dir,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => {
          stdout += String(chunk);
        });
        child.stderr.on('data', (chunk: Buffer) => {
          stderr += String(chunk);
        });
        child.on('error', reject);
        child.on('close', (code: number | null) => {
          resolve(CliRunResultStub({ stdout, stderr, exitCode: code ?? 0 }));
        });
      }),
    seedGitBaseline: async ({
      workBranch,
      stableBranch,
      sources,
      message,
    }: {
      workBranch: string;
      stableBranch: string;
      sources: readonly { relPath: string; source: string }[];
      message: string;
    }): Promise<void> => {
      const initRun = await gitRun({ args: ['init', '-q', '-b', workBranch], cwd: dir });
      if (initRun.exitCode !== 0) {
        throw new Error(`git init -q -b ${workBranch} failed in ${dir}: ${initRun.output}`);
      }
      sources.forEach(({ relPath, source }) => {
        const target = join(dir, relPath);
        ensureDirSync(dirname(target));
        writeFileSync(target, source);
      });
      const addRun = await gitRun({ args: ['add', '-A'], cwd: dir });
      if (addRun.exitCode !== 0) {
        throw new Error(`git add -A failed in ${dir}: ${addRun.output}`);
      }
      const commitRun = await gitRun({
        args: [
          '-c',
          'user.email=assayer@test.local',
          '-c',
          'user.name=Assayer',
          '-c',
          'commit.gpgsign=false',
          'commit',
          '-q',
          '-m',
          message,
        ],
        cwd: dir,
      });
      if (commitRun.exitCode !== 0) {
        throw new Error(`git commit -q -m ${message} failed in ${dir}: ${commitRun.output}`);
      }
      // A stable branch equal to the work branch already exists after the commit.
      const branchRun =
        stableBranch === workBranch
          ? { exitCode: 0, output: '' }
          : await gitRun({ args: ['branch', stableBranch], cwd: dir });
      if (branchRun.exitCode !== 0) {
        throw new Error(`git branch ${stableBranch} failed in ${dir}: ${branchRun.output}`);
      }
    },
    headBranch: async (): Promise<string> =>
      ((await currentBranch({ cwd: dir })) ?? ''),
    read: ({ relPath }: { relPath: string }): string =>
      readFileSync(join(dir, relPath)),
    exists: ({ relPath }: { relPath: string }): boolean => existsSync(join(dir, relPath)),
    manifestNamespaceNames: (): readonly string[] => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json')),
      ) as Manifest;
      return Object.keys(manifest.namespaces)
        .sort((a, b) => (a < b ? -1 : 1))
        .map((name) => name);
    },
    manifestRelPaths: ({ namespace }: { namespace: string }): readonly string[] => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json')),
      ) as Manifest;
      return (manifest.namespaces[namespace]?.files ?? [])
        .map((file) => String(file.relPath))
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .map((relPath) => relPath);
    },
    manifestContentHash: ({
      namespace,
      relPath,
    }: {
      namespace: string;
      relPath: string;
    }): ContentHash => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json')),
      ) as Manifest;
      const entry = (manifest.namespaces[namespace]?.files ?? []).find(
        (file) => String(file.relPath) === relPath,
      );
      if (entry === undefined) {
        throw new Error(`no manifest entry for ${relPath} in namespace ${namespace}`);
      }
      return entry.contentHash;
    },
    manifestNamespaceHasCommit: ({ namespace }: { namespace: string }): boolean => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json')),
      ) as Manifest;
      return manifest.namespaces[namespace]?.commit !== undefined;
    },
    blobHashes: (): readonly ContentHash[] => {
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      if (!existsSync(blobsDir)) {
        return [];
      }
      return readdirSync(blobsDir)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.slice(0, -'.json'.length))
        .sort((a, b) => (a < b ? -1 : 1))
        .map((hash) => ContentHashStub({ value: hash }));
    },
    readBlobText: ({ hash }: { hash: string }): string =>
      readFileSync(join(dir, '.assayer', 'cache', 'blobs', `${hash}.json`)),
    blobSourceText: ({ namespace, relPath }: { namespace: string; relPath: string }): string => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json')),
      ) as Manifest;
      const entry = (manifest.namespaces[namespace]?.files ?? []).find(
        (file) => String(file.relPath) === relPath,
      );
      if (entry === undefined) {
        throw new Error(`no manifest entry for ${relPath} in namespace ${namespace}`);
      }
      const blob = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'blobs', `${entry.contentHash}.json`)),
      ) as Blob;
      return blob.displayLines.map((line) => String(line.text)).join('\n');
    },
    concatAllBlobs: (): string => {
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      const names = readdirSync(blobsDir)
        .filter((name) => name.endsWith('.json'))
        .sort((a, b) => (a < b ? -1 : 1));
      const joined = names.map((name) => readFileSync(join(blobsDir, name))).join('\n');
      return joined;
    },
  };
};
