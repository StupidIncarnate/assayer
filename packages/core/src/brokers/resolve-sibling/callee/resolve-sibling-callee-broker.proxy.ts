import { importSpecifierResolveBrokerProxy } from '../../import-specifier/resolve/import-specifier-resolve-broker.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

import { fileWalkBrokerProxy } from '../../file/walk/file-walk-broker.proxy';
import { tsconfigOwnerBrokerProxy } from '../../tsconfig/owner/tsconfig-owner-broker.proxy';

export const resolveSiblingCalleeBrokerProxy = (): {
  // Every scenario names the exact import specifier the caller source spells (e.g. './over'), so each
  // resolve answers the call that actually named it. A specifier no scenario named reaches an unstaged
  // call, which throws.
  resolvesToSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  resolvesToOutside: ({ fileName, specifier }: { fileName: string; specifier: string }) => void;
  resolvesToNothing: ({ specifier }: { specifier: string }) => void;
  // No tsconfig owns the importing file, so its specifiers resolve under TypeScript's defaults.
  callerWithoutOwner: ({ containingFile }: { containingFile: string }) => void;
} => {
  // `relative` from the path gateway and the walk run REAL (deterministic path math, real parse). The
  // module resolver runs REAL over the typescript gateway's resolver, which its proxy stages: the
  // caller says where a specifier lands and what its source is. Nothing is staged for the sibling read
  // until resolvesToSibling names the exact resolved file.
  const reads = readFileSyncProxy();
  const resolveProxy = importSpecifierResolveBrokerProxy();
  const walk = fileWalkBrokerProxy();
  const owner = tsconfigOwnerBrokerProxy();

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a walkable sibling
    // needs. The read is matched on the exact resolved `fileName`. No tsconfig owns the sibling, so it
    // walks under TypeScript's defaults.
    resolvesToSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      resolveProxy.resolvesToOnce({ specifier, fileName });
      reads.returns({ path: fileName, contents: source });
      walk.filesWithoutOwner({ absPaths: [fileName] });
    },
    // Resolution lands somewhere but the file is a node_modules / outside-root file the broker skips as
    // non-local — its source is never read.
    resolvesToOutside: ({ fileName, specifier }: { fileName: string; specifier: string }): void => {
      resolveProxy.resolvesToOnce({ specifier, fileName });
    },
    // The specifier points at nothing: a broken import.
    resolvesToNothing: ({ specifier }: { specifier: string }): void => {
      resolveProxy.resolvesToNothingOnce({ specifier });
    },
    callerWithoutOwner: ({ containingFile }: { containingFile: string }): void => {
      owner.filesWithoutOwner({ absPaths: [containingFile] });
    },
  };
};
