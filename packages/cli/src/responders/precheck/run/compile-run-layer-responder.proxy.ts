import {
  configHashBrokerProxy,
  manifestLoadBrokerProxy,
  manifestTrashBrokerProxy,
  compileRunBrokerProxy,
} from '@assayer/core/testing';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts';

import { compileProgressRenderBrokerProxy } from '../../../brokers/compile-progress/render/compile-progress-render-broker.proxy';

type AssayerCacheManifest = ReturnType<typeof AssayerCacheManifestStub>;

export const CompileRunLayerResponderProxy = (): {
  manifestMissing: (params: { configDir: string }) => void;
  manifestInvalid: (params: { configDir: string }) => void;
  manifestOk: (params: { configDir: string; manifest: AssayerCacheManifest }) => void;
  compileSucceeds: (params: { configDir: string; root: string }) => void;
  compileFails: (params: {
    configDir: string;
    root: string;
    relPath: string;
    line: number;
    column: number;
    message: string;
  }) => void;
  getTrashCalls: (params: { configDir: string }) => readonly unknown[][];
  wasManifestWritten: (params: { configDir: string }) => boolean;
  getWrittenManifest: (params: { configDir: string }) => unknown;
} => {
  configHashBrokerProxy();
  const loadProxy = manifestLoadBrokerProxy();
  const trashProxy = manifestTrashBrokerProxy();
  const compileProxy = compileRunBrokerProxy();
  compileProgressRenderBrokerProxy();

  // A compile of a root holding no source files. Its walk of `root` is its only read, so the blob
  // store under `configDir` is never touched, and the one write is the manifest under `configDir`.
  const compileEmptyRoot = ({ configDir, root }: { configDir: string; root: string }): void => {
    compileProxy.onCurrentBranch({ name: 'feature-x' });
    compileProxy.queueCurrentFiles({ configDir: root, contents: [] });
    compileProxy.manifestWriteSucceeds({ configDir });
  };

  return {
    manifestMissing: ({ configDir }: { configDir: string }): void => {
      loadProxy.absent({ configDir });
    },
    // A manifest that is not JSON reads as invalid, so the responder trashes the whole cache.
    manifestInvalid: ({ configDir }: { configDir: string }): void => {
      loadProxy.malformed({ configDir });
      trashProxy.succeeds({ path: `${configDir}/.assayer/cache` });
    },
    manifestOk: ({ configDir, manifest }: { configDir: string; manifest: AssayerCacheManifest }): void => {
      loadProxy.present({ configDir, manifestJson: JSON.stringify(manifest) });
    },
    compileSucceeds: compileEmptyRoot,
    compileFails: ({
      configDir,
      root,
      relPath,
      line,
      column,
      message,
    }: {
      configDir: string;
      root: string;
      relPath: string;
      line: number;
      column: number;
      message: string;
    }): void => {
      compileEmptyRoot({ configDir, root });
      compileProxy.resolvesWithError({ relPath, line, column, message });
    },
    getTrashCalls: ({ configDir }: { configDir: string }): readonly unknown[][] =>
      trashProxy.getRmCalls({ path: `${configDir}/.assayer/cache` }),
    wasManifestWritten: ({ configDir }: { configDir: string }): boolean =>
      compileProxy.wasManifestWritten({ configDir }),
    getWrittenManifest: ({ configDir }: { configDir: string }): unknown =>
      compileProxy.getWrittenManifest({ configDir }),
  };
};
