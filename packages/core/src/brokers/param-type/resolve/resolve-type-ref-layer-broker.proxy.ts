import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const resolveTypeRefLayerBrokerProxy = (): {
  setupDefinition: ({ fileName, source }: { fileName: string; source: string }) => void;
  resolvesOutsideRepo: ({ fileName }: { fileName: string }) => void;
} => {
  // Only the sibling resolve is staged: landing a specifier on a real filesystem is exactly what a unit
  // test cannot do, so the caller says where a specifier lands and what the definition's source is.
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    // A definition both RESOLVES to `fileName` and READS back `source` — the pair a cross-file type
    // reference needs. Queued once, so several definitions wire in the order the refs resolve.
    setupDefinition: ({ fileName, source }: { fileName: string; source: string }): void => {
      sibling.resolvesToSibling({ fileName, source });
    },
    // Resolution lands somewhere the walk will not follow — under node_modules or outside the root — so
    // the reference stays opaque and no source is read.
    resolvesOutsideRepo: ({ fileName }: { fileName: string }): void => {
      sibling.resolvesToOutside({ fileName });
    },
  };
};
