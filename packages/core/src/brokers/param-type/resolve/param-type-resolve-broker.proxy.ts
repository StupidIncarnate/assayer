import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveTypeRefLayerBrokerProxy } from './resolve-type-ref-layer-broker.proxy';

export const paramTypeResolveBrokerProxy = (): {
  // `specifier` is the import path the file under test spells (e.g. './types').
  setupDefinition: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  resolvesOutsideRepo: ({ fileName, specifier }: { fileName: string; specifier: string }) => void;
} => {
  // The analyze and the tsconfig read run REAL — re-projecting the file from its retyped walk is the
  // behaviour under test, not a dependency to stage. Only the sibling definition is staged, through the
  // layer broker's own proxy.
  analyzeFileBrokerProxy();
  tsconfigReadBrokerProxy();
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
  };
};
