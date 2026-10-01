import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const resolveTypeRefLayerBrokerProxy = (): {
  // `specifier` is the import path the reading file spells (e.g. './types'), so each resolve answers
  // only the import that named it.
  setupDefinition: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  resolvesOutsideRepo: ({ fileName, specifier }: { fileName: string; specifier: string }) => void;
} => {
  // Only the sibling resolve is staged: landing a specifier on a real filesystem is exactly what a unit
  // test cannot do, so the caller says where a specifier lands and what the definition's source is.
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    // A definition both RESOLVES to `fileName` and READS back `source` — the pair a cross-file type
    // reference needs. Each one answers one resolve of its specifier.
    setupDefinition: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      sibling.resolvesToSibling({ fileName, source, specifier });
    },
    // Resolution lands somewhere the walk will not follow — under node_modules or outside the root — so
    // the reference stays opaque and no source is read.
    resolvesOutsideRepo: ({ fileName, specifier }: { fileName: string; specifier: string }): void => {
      sibling.resolvesToOutside({ fileName, specifier });
    },
  };
};
