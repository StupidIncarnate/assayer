/**
 * PURPOSE: Drives the compile pipeline end-to-end through the REAL built assayer CLI
 *   (packages/cli/dist/bin/assayer.js) against a fresh, hermetic temp working directory OUTSIDE
 *   the repo per test (created in beforeEach, removed in afterEach) so config-lookup walks up to
 *   nothing. Beyond spawning the CLI, it can turn the temp dir into a real (hermetic) git repo —
 *   committing a baseline on a work branch and creating a `master` branch pointer WITHOUT ever
 *   checking out — so the stable-namespace (git blobs) and current-namespace (working tree) caches
 *   are both exercised. It reads back the written .assayer/cache manifest + content-addressed blobs
 *   so a colocated .integration.test.ts asserts on the compiled surface (namespaces, per-file
 *   content hashes, reconstructed source, blob reuse) without touching node builtins itself. Owns
 *   all node:fs / node:child_process access. Requires `tsc --build tsconfig.build.json` first so
 *   dist/bin/assayer.js exists.
 *
 * USAGE:
 * const compile = assayerCompileHarness();
 * // beforeEach makes a fresh temp cwd; afterEach removes it (auto-wired by the harness transformer)
 * compile.writeConfig({ json: '{"repoRoot":".","exclude":[]}' });
 * compile.writeSource({ relPath: 'src/a.ts', source: 'export const a = (): number => 1;\n' });
 * await compile.run({ argv: ['status'] });
 * compile.manifestRelPaths({ namespace: 'default' }); // => ['src/a.ts']
 */
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';

import { CliRunResultStub } from '../../src/contracts/cli-run-result/cli-run-result.stub';
import type { CliRunResult } from '../../src/contracts/cli-run-result/cli-run-result-contract';
import { CliFileTextStub } from '../../src/contracts/cli-file-text/cli-file-text.stub';
import type { CliFileText } from '../../src/contracts/cli-file-text/cli-file-text-contract';
import {
  BranchNameStub,
  RelPathStub,
  ContentHashStub,
} from '@assayer/shared/contracts';
import type { BranchName, RelPath, ContentHash ,
  AssayerCacheManifestStub,
  CompiledFileBlobStub} from '@assayer/shared/contracts';

const cliEntry = join(__dirname, '..', '..', 'dist', 'bin', 'assayer.js');

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
  headBranch: () => Promise<CliFileText>;
  read: ({ relPath }: { relPath: string }) => CliFileText;
  exists: ({ relPath }: { relPath: string }) => boolean;
  manifestNamespaceNames: () => readonly BranchName[];
  manifestRelPaths: ({ namespace }: { namespace: string }) => readonly RelPath[];
  manifestContentHash: ({ namespace, relPath }: { namespace: string; relPath: string }) => ContentHash;
  manifestNamespaceHasCommit: ({ namespace }: { namespace: string }) => boolean;
  blobHashes: () => readonly ContentHash[];
  readBlobText: ({ hash }: { hash: string }) => CliFileText;
  blobSourceText: ({ namespace, relPath }: { namespace: string; relPath: string }) => CliFileText;
  concatAllBlobs: () => CliFileText;
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
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, source);
    },
    removeCache: (): void => {
      rmSync(join(dir, '.assayer'), { recursive: true, force: true });
    },
    run: async ({ argv }: { argv: readonly string[] }): Promise<CliRunResult> =>
      new Promise((resolve: (result: CliRunResult) => void, reject: (error: Error) => void) => {
        const child = spawn(process.execPath, [cliEntry, ...argv], {
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
      await new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
        const child = spawn('git', ['init', '-q', '-b', workBranch], { cwd: dir, stdio: 'ignore' });
        child.on('error', reject);
        child.on('close', () => {
          resolve();
        });
      });
      sources.forEach(({ relPath, source }) => {
        const target = join(dir, relPath);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, source);
      });
      await new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
        const child = spawn('git', ['add', '-A'], { cwd: dir, stdio: 'ignore' });
        child.on('error', reject);
        child.on('close', () => {
          resolve();
        });
      });
      await new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
        const child = spawn(
          'git',
          [
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
          { cwd: dir, stdio: 'ignore' },
        );
        child.on('error', reject);
        child.on('close', () => {
          resolve();
        });
      });
      await new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
        const child = spawn('git', ['branch', stableBranch], { cwd: dir, stdio: 'ignore' });
        child.on('error', reject);
        child.on('close', () => {
          resolve();
        });
      });
    },
    headBranch: async (): Promise<CliFileText> =>
      new Promise((resolve: (value: CliFileText) => void, reject: (error: Error) => void) => {
        const child = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
          cwd: dir,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        child.stdout.on('data', (chunk: Buffer) => {
          stdout += String(chunk);
        });
        child.on('error', reject);
        child.on('close', () => {
          resolve(CliFileTextStub({ value: stdout.trim() }));
        });
      }),
    read: ({ relPath }: { relPath: string }): CliFileText =>
      CliFileTextStub({ value: readFileSync(join(dir, relPath), 'utf8') }),
    exists: ({ relPath }: { relPath: string }): boolean => existsSync(join(dir, relPath)),
    manifestNamespaceNames: (): readonly BranchName[] => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json'), 'utf8'),
      ) as Manifest;
      return Object.keys(manifest.namespaces)
        .sort((a, b) => (a < b ? -1 : 1))
        .map((name) => BranchNameStub({ value: name }));
    },
    manifestRelPaths: ({ namespace }: { namespace: string }): readonly RelPath[] => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json'), 'utf8'),
      ) as Manifest;
      return (manifest.namespaces[namespace]?.files ?? [])
        .map((file) => String(file.relPath))
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .map((relPath) => RelPathStub({ value: relPath }));
    },
    manifestContentHash: ({
      namespace,
      relPath,
    }: {
      namespace: string;
      relPath: string;
    }): ContentHash => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json'), 'utf8'),
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
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json'), 'utf8'),
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
    readBlobText: ({ hash }: { hash: string }): CliFileText =>
      CliFileTextStub({
        value: readFileSync(join(dir, '.assayer', 'cache', 'blobs', `${hash}.json`), 'utf8'),
      }),
    blobSourceText: ({ namespace, relPath }: { namespace: string; relPath: string }): CliFileText => {
      const manifest = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'manifest.json'), 'utf8'),
      ) as Manifest;
      const entry = (manifest.namespaces[namespace]?.files ?? []).find(
        (file) => String(file.relPath) === relPath,
      );
      if (entry === undefined) {
        throw new Error(`no manifest entry for ${relPath} in namespace ${namespace}`);
      }
      const blob = JSON.parse(
        readFileSync(join(dir, '.assayer', 'cache', 'blobs', `${String(entry.contentHash)}.json`), 'utf8'),
      ) as Blob;
      return CliFileTextStub({ value: blob.displayLines.map((line) => String(line.text)).join('\n') });
    },
    concatAllBlobs: (): CliFileText => {
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      const names = readdirSync(blobsDir)
        .filter((name) => name.endsWith('.json'))
        .sort((a, b) => (a < b ? -1 : 1));
      const joined = names.map((name) => readFileSync(join(blobsDir, name), 'utf8')).join('\n');
      return CliFileTextStub({ value: joined });
    },
  };
};
