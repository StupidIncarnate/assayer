import { AssayerConfigStub, AssayerCacheManifestStub } from '@assayer/shared/contracts';
import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';

import { compileRunBroker } from './compile-run-broker';
import { compileRunBrokerProxy } from './compile-run-broker.proxy';

const CONFIG_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('compileRunBroker', () => {
  describe('net-new run with no stable branch configured', () => {
    it('VALID: {two clean current files, no stableBranch, no previousManifest} => returns status ok with one result entry and writes the manifest', async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      proxy.queueCurrentFiles({ contents: ['export const a = 1;\n', 'export const b = 2;\n'] });
      proxy.manifestWriteSucceeds();
      const config = AssayerConfigStub();

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'ok',
        results: [{ namespace: 'feature-x', branch: 'feature-x', mode: 'net-new', fileCount: 2 }],
        errors: [],
      });
      expect(proxy.wasManifestWritten()).toBe(true);
    });
  });

  describe('stable branch whose commit is unchanged since the previous compile', () => {
    it("VALID: {stableBranch commit unchanged, one clean current file} => reuses the previous manifest's stable files and never processes a stable file", async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      proxy.stableUnchanged({ sha: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0' });
      const currentContent = 'export const a = 1;\n';
      const currentHash = cryptoSha256Adapter({ content: currentContent });
      proxy.queueCurrentFiles({ contents: [currentContent] });
      proxy.manifestWriteSucceeds();
      const previousManifest = AssayerCacheManifestStub();
      const config = AssayerConfigStub({ stableBranch: 'master' });

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        previousManifest,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'ok',
        results: [
          { namespace: 'master', branch: 'master', mode: 'skipped', fileCount: 0 },
          { namespace: 'feature-x', branch: 'feature-x', mode: 'incremental', fileCount: 1 },
        ],
        errors: [],
      });
      expect(proxy.getWrittenManifest()).toStrictEqual({
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
        namespaces: {
          master: {
            branch: 'master',
            commit: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
            files: [
              {
                relPath: 'packages/shared/src/index.ts',
                contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
            ],
          },
          'feature-x': { branch: 'feature-x', files: [{ relPath: 'current-0.ts', contentHash: currentHash }] },
        },
        repoName: 'repo',
        rootFolderName: 'repo',
      });
      expect(proxy.getProcessedFileCount()).toBe(1);
    });
  });

  describe('a current file that fails to parse (net-new run)', () => {
    it("ERROR: {net-new run, one current file with invalid syntax} => returns status errors with that file's namespace/relPath/line/column/message and never writes the manifest", async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      proxy.queueCurrentFiles({ contents: ['const x = ;;;{{{'] });
      const config = AssayerConfigStub();

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'errors',
        results: [{ namespace: 'feature-x', branch: 'feature-x', mode: 'net-new', fileCount: 1 }],
        errors: [{ namespace: 'feature-x', relPath: 'current-0.ts', line: 1, column: 11, message: 'Expression expected.' }],
      });
      expect(proxy.wasManifestWritten()).toBe(false);
    });
  });

  describe('a current file with an unresolvable import (net-new run)', () => {
    it("ERROR: {clean parse, but an import resolves to nothing} => status errors with the resolver's namespace/relPath/line/column/message and never writes the manifest", async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      proxy.queueCurrentFiles({ contents: ["import { foo } from './missing';\nfoo();\n"] });
      proxy.resolvesWithError({ relPath: 'current-0.ts', line: 1, column: 10, message: "cannot resolve import './missing'" });
      const config = AssayerConfigStub();

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'errors',
        results: [{ namespace: 'feature-x', branch: 'feature-x', mode: 'net-new', fileCount: 1 }],
        errors: [
          { namespace: 'feature-x', relPath: 'current-0.ts', line: 1, column: 10, message: "cannot resolve import './missing'" },
        ],
      });
    });
  });

  describe('a current file that fails to parse (incremental run)', () => {
    it('ERROR: {incremental run, one current file with invalid syntax} => returns status errors and never writes the manifest', async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      proxy.queueCurrentFiles({ contents: ['const x = ;;;{{{'] });
      const previousManifest = AssayerCacheManifestStub();
      const config = AssayerConfigStub();

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        previousManifest,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'errors',
        results: [{ namespace: 'feature-x', branch: 'feature-x', mode: 'incremental', fileCount: 1 }],
        errors: [{ namespace: 'feature-x', relPath: 'current-0.ts', line: 1, column: 11, message: 'Expression expected.' }],
      });
      expect(proxy.wasManifestWritten()).toBe(false);
    });
  });

  describe('both a stable branch and the current branch resolved', () => {
    it('VALID: {stableBranch and currentBranch both defined, clean run} => writes a manifest whose namespaces object has exactly the two branch keys', async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      const stableContent = 'export const stable = 1;\n';
      const stableHash = cryptoSha256Adapter({ content: stableContent });
      proxy.stableChanged({
        sha: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/stable.ts\n`,
        fileContents: [stableContent],
      });
      const currentContent = 'export const current = 1;\n';
      const currentHash = cryptoSha256Adapter({ content: currentContent });
      proxy.queueCurrentFiles({ contents: [currentContent] });
      proxy.manifestWriteSucceeds();
      const config = AssayerConfigStub({ stableBranch: 'master' });

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'ok',
        results: [
          { namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 },
          { namespace: 'feature-x', branch: 'feature-x', mode: 'net-new', fileCount: 1 },
        ],
        errors: [],
      });
      expect(proxy.getWrittenManifest()).toStrictEqual({
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
        namespaces: {
          master: {
            branch: 'master',
            commit: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            files: [{ relPath: 'src/stable.ts', contentHash: stableHash }],
          },
          'feature-x': { branch: 'feature-x', files: [{ relPath: 'current-0.ts', contentHash: currentHash }] },
        },
        repoName: 'repo',
        rootFolderName: 'repo',
      });
    });
  });

  describe('a resolver error with both a stable branch and the current branch resolved', () => {
    it("ERROR: {stableBranch and currentBranch both processed, resolver returns an error} => status errors carrying the SAME resolution error under BOTH namespaces (stable is stitched too)", async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      const stableContent = 'export const stable = 1;\n';
      proxy.stableChanged({
        sha: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/stable.ts\n`,
        fileContents: [stableContent],
      });
      proxy.queueCurrentFiles({ contents: ['export const current = 1;\n'] });
      proxy.resolvesWithError({ relPath: 'src/x.ts', line: 3, column: 10, message: "cannot resolve import './missing'" });
      const config = AssayerConfigStub({ stableBranch: 'master' });

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'errors',
        results: [
          { namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 },
          { namespace: 'feature-x', branch: 'feature-x', mode: 'net-new', fileCount: 1 },
        ],
        errors: [
          { namespace: 'master', relPath: 'src/x.ts', line: 3, column: 10, message: "cannot resolve import './missing'" },
          { namespace: 'feature-x', relPath: 'src/x.ts', line: 3, column: 10, message: "cannot resolve import './missing'" },
        ],
      });
    });
  });

  describe('onProgress callback provided', () => {
    it('VALID: {onProgress set, no stableBranch, one clean current file} => receives planned, advanced, and done events for the current namespace in order', async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      proxy.queueCurrentFiles({ contents: ['export const a = 1;\n'] });
      proxy.manifestWriteSucceeds();
      const config = AssayerConfigStub();
      const events: unknown[] = [];

      await compileRunBroker({
        configDir: '/repo',
        config,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
        onProgress: (event) => {
          events.push(event);
        },
      });

      expect(events).toStrictEqual([
        { namespace: 'feature-x', branch: 'feature-x', phase: 'planned', current: 0, max: 1, stableMax: 0, currentMax: 1 },
        { namespace: 'feature-x', branch: 'feature-x', phase: 'advanced', current: 1, max: 1, stableMax: 0, currentMax: 1, reused: false },
        { namespace: 'feature-x', branch: 'feature-x', phase: 'done', current: 1, max: 1, stableMax: 0, currentMax: 1 },
      ]);
    });
  });

  describe('stable branch ref that does not resolve to a commit', () => {
    it('EDGE: {stableBranch configured but its ref does not resolve} => writes the stable manifest namespace without a commit field', async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'feature-x' });
      const stableContent = 'export const stable = 1;\n';
      const stableHash = cryptoSha256Adapter({ content: stableContent });
      proxy.stableChangedCommitUnresolvable({
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/stable.ts\n`,
        fileContents: [stableContent],
      });
      proxy.queueCurrentFiles({ contents: [] });
      proxy.manifestWriteSucceeds();
      const config = AssayerConfigStub({ stableBranch: 'master' });

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'ok',
        results: [
          { namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 },
          { namespace: 'feature-x', branch: 'feature-x', mode: 'net-new', fileCount: 0 },
        ],
        errors: [],
      });
      expect(proxy.getWrittenManifest()).toStrictEqual({
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
        namespaces: {
          master: { branch: 'master', files: [{ relPath: 'src/stable.ts', contentHash: stableHash }] },
          'feature-x': { branch: 'feature-x', files: [] },
        },
        repoName: 'repo',
        rootFolderName: 'repo',
      });
    });
  });

  describe('current branch is also the configured stable branch (namespace-key collision)', () => {
    it('EDGE: {currentBranch === stableBranch, current file the stable index lacks} => manifest has exactly one namespace for that branch equal to the CURRENT working-tree index (uncommitted file wins), not the stable committed index', async () => {
      const proxy = compileRunBrokerProxy();
      proxy.onCurrentBranch({ name: 'master' });
      const stableContent = 'export const stable = 1;\n';
      proxy.stableChanged({
        sha: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/stable.ts\n`,
        fileContents: [stableContent],
      });
      const currentContent = 'export const current = 1;\n';
      const currentHash = cryptoSha256Adapter({ content: currentContent });
      proxy.queueCurrentFiles({ contents: [currentContent] });
      proxy.manifestWriteSucceeds();
      const config = AssayerConfigStub({ stableBranch: 'master' });

      const result = await compileRunBroker({
        configDir: '/repo',
        config,
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
      });

      expect(result).toStrictEqual({
        status: 'ok',
        results: [
          { namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 },
          { namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 },
        ],
        errors: [],
      });
      expect(proxy.getWrittenManifest()).toStrictEqual({
        assayerVersion: '1.0.0',
        configHash: CONFIG_HASH,
        namespaces: {
          master: { branch: 'master', files: [{ relPath: 'current-0.ts', contentHash: currentHash }] },
        },
        repoName: 'repo',
        rootFolderName: 'repo',
      });
    });
  });
});
