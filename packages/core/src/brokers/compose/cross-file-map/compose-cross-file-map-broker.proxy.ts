import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const composeCrossFileMapBrokerProxy = (): {
  // `specifier` is the import path the host source spells (e.g. './band-reading'), so each resolve
  // answers only the import that named it.
  setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
} => {
  // The tsconfig read runs REAL, and the reaches + funnel transformers are pure — only the sibling
  // resolve is staged, since resolving an imported callee against a real filesystem is exactly what a
  // unit test cannot do. The caller says where the specifier lands and what the sibling's source is.
  tsconfigReadBrokerProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      sibling.resolvesToSibling({ fileName, source, specifier });
    },
  };
};
