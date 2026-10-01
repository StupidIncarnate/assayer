import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { resolveTypeRefLayerBrokerProxy } from './resolve-type-ref-layer-broker.proxy';

export const paramTypeResolveBrokerProxy = (): {
  // `specifier` is the import path the file under test spells (e.g. './types').
  setupDefinition: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  resolvesOutsideRepo: ({ fileName, specifier }: { fileName: string; specifier: string }) => void;
  // No tsconfig owns the caller file at `root/relPath`, so its imports resolve under TypeScript's defaults.
  callerWithoutOwner: ({ root, relPath }: { root: string; relPath: string }) => void;
} => {
  // The analyze runs REAL — re-projecting the file from its retyped walk is the behaviour under test,
  // not a dependency to stage. The owning-tsconfig lookup and the sibling definition are staged, since each reads
  // the real filesystem.
  analyzeFileBrokerProxy();
  const refs = resolveTypeRefLayerBrokerProxy();

  return {
    // The file a type reference resolves to, and the source its declaration is read from.
    setupDefinition: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      refs.setupDefinition({ fileName, source, specifier });
    },
    // The reference lands on a file the walk will not follow — under node_modules or outside the root —
    // so it stays opaque and whatever the per-file derivation refused stays refused.
    resolvesOutsideRepo: ({ fileName, specifier }: { fileName: string; specifier: string }): void => {
      refs.resolvesOutsideRepo({ fileName, specifier });
    },
    callerWithoutOwner: ({ root, relPath }: { root: string; relPath: string }): void => {
      refs.callerWithoutOwner({ containingFile: `${root}/${relPath}` });
    },
  };
};
