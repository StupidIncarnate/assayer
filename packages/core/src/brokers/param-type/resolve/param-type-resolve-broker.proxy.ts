import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveTypeRefLayerBrokerProxy } from './resolve-type-ref-layer-broker.proxy';

export const paramTypeResolveBrokerProxy = (): {
  setupDefinition: ({ fileName, source }: { fileName: string; source: string }) => void;
  resolvesOutsideRepo: ({ fileName }: { fileName: string }) => void;
} => {
  // The analyze and the tsconfig read run REAL — re-projecting the file from its retyped walk is the
  // behaviour under test, not a dependency to stage. Only the sibling definition is staged, through the
  // layer broker's own proxy.
  analyzeFileBrokerProxy();
  tsconfigReadBrokerProxy();
  const refs = resolveTypeRefLayerBrokerProxy();

  return {
    // The file a type reference resolves to, and the source its declaration is read from.
    setupDefinition: ({ fileName, source }: { fileName: string; source: string }): void => {
      refs.setupDefinition({ fileName, source });
    },
    // The reference lands on a file the walk will not follow — under node_modules or outside the root —
    // so it stays opaque and whatever the per-file derivation refused stays refused.
    resolvesOutsideRepo: ({ fileName }: { fileName: string }): void => {
      refs.resolvesOutsideRepo({ fileName });
    },
  };
};
