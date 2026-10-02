import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const composeCrossFileMapBrokerProxy = (): {
  // `specifier` is the import path the host source spells (e.g. './band-reading'), so each resolve
  // answers only the import that named it.
  setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  // No tsconfig owns the caller file at `root/relPath`, so its imports resolve under TypeScript's defaults.
  callerWithoutOwner: ({ root, relPath }: { root: string; relPath: string }) => void;
} => {
  // The reaches + funnel transformers are pure and run REAL. The tsconfig read and the sibling resolve
  // are staged, since each reads the real filesystem, which a unit test cannot do. The caller says where
  // the specifier lands, what the sibling's source is, and that no tsconfig owns the caller file.
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      sibling.resolvesToSibling({ fileName, source, specifier });
    },
    callerWithoutOwner: ({ root, relPath }: { root: string; relPath: string }): void => {
      sibling.callerWithoutOwner({ containingFile: `${root}/${relPath}` });
    },
  };
};
