import { typescriptReadConfigAdapterProxy } from '../../../adapters/typescript/read-config/typescript-read-config-adapter.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const composeCrossFilePredicatesBrokerProxy = (): {
  setupSibling: ({ fileName, source }: { fileName: string; source: string }) => void;
  resolvesTo: ({ fileName }: { fileName: string }) => void;
} => {
  // The tsconfig read runs REAL; the sibling resolve is staged, since resolving a specifier against a
  // real filesystem is exactly what a unit test cannot do — the caller says where a specifier lands and
  // what its source is instead.
  typescriptReadConfigAdapterProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a composable branch
    // needs. Queued once so multiple siblings are wired in the order their branches compose.
    setupSibling: ({ fileName, source }: { fileName: string; source: string }): void => {
      sibling.resolvesToSibling({ fileName, source });
    },
    // Resolution lands somewhere but its source is never read — a node_modules / outside-root file the
    // compose skips as non-local.
    resolvesTo: ({ fileName }: { fileName: string }): void => {
      sibling.resolvesToOutside({ fileName });
    },
  };
};
