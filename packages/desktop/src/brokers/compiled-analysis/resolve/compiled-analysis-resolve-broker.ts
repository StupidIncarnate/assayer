/**
 * PURPOSE: Resolves the analysis the desktop shows for one compiled file: the persisted blob's analysis
 *   with the consume-time overlays applied against the sibling files on disk. A parameter declared as an
 *   IMPORTED type is given the shape its declaration says, a caller's opaque guard over an IMPORTED
 *   predicate is composed, an object-member branch is driven from the merged stub view, an imported
 *   function mapped over an array is folded in, and a colocated harness pays the input gaps it answers.
 *   The file view and the file tree both read this one result, so a file's error badge always counts the
 *   admissions its detail panel lists. Each overlay is a same-reference no-op for a file it does not
 *   touch, and a file whose source cannot be read keeps the persisted analysis.
 *
 * USAGE:
 * const analysis = await compiledAnalysisResolveBroker({ repoPath: '/repo', relPath: 'src/index.ts', blob });
 * // Returns the overlaid FileAnalysis, or undefined when the blob carries no analysis.
 */
import type { CompiledFileBlob, FileAnalysis } from '@assayer/shared/contracts';
import { composeCrossFilePredicatesBroker, composeCrossFileMapBroker, fileWalkBroker, harnessRealizeBroker, paramTypeResolveBroker, stubRealizeBroker, stubOverlayLoadBroker } from '@assayer/core/brokers';

import { repoSourceRootBroker } from '../../repo/source-root/repo-source-root-broker';
import { readFileIfExists } from '#gateway/node/fs__promises';

export const compiledAnalysisResolveBroker = async ({
  repoPath,
  relPath,
  blob,
}: {
  repoPath: string;
  relPath: string;
  blob: CompiledFileBlob;
}): Promise<FileAnalysis | undefined> => {
  // Overlay the consume-time passes on the persisted (child-independent) analysis, at serve time,
  // against the caller source on disk under the SOURCE root (not the config dir). The walk reads the file
  // under the tsconfig that owns it, the same options the compile wrote the blob with. A missing source, or a
  // blob that carries no analysis, serves the opaque analysis untouched — both overlays are same-
  // reference no-ops for a file they do not touch.
  const root = blob.analysis === undefined ? undefined : await repoSourceRootBroker({ repoPath });
  const source =
    root === undefined ? null : await readFileIfExists(`${root}/${relPath}`);
  const walked =
    source === null ? undefined : fileWalkBroker({ source, relPath, absPath: `${String(root)}/${relPath}` });
  // The types first: a parameter declared as an IMPORTED type is `any` in the hermetic walk, so the
  // per-file blob refuses it and invoices an input Assayer can build. Resolving the declaration against
  // the sibling on disk is what lets every overlay below read real parameter types.
  const typed =
    blob.analysis === undefined || root === undefined || walked === undefined
      ? blob.analysis
      : paramTypeResolveBroker({ analysis: blob.analysis, walked, root, relPath });
  const composed =
    typed === undefined || root === undefined || walked === undefined
      ? typed
      : composeCrossFilePredicatesBroker({ analysis: typed, walked, root, relPath });
  // The object-arrange overlay on top: an object-member branch (`if (config.mode === 'a')`) is DRIVEN
  // from the merged stub view — the derived per-property demands combined with the committed
  // `assayer/stubs/` overlay under the SAME source root, read fresh per serve and never persisted.
  const realized =
    composed === undefined || root === undefined || walked === undefined
      ? composed
      : stubRealizeBroker({
          analysis: composed,
          walked,
          root,
          relPath,
          overlays: await stubOverlayLoadBroker({ repoRoot: root }),
        });
  // The cross-file-map fold next: a surface mapping an IMPORTED function over an array param folds that
  // sibling callee's branches into the surface's cases, so the Tests tab shows the folded funnel. A
  // same-reference no-op for a file with no such map.
  const mapped =
    realized === undefined || root === undefined || walked === undefined
      ? realized
      : composeCrossFileMapBroker({ analysis: realized, walked, root, relPath });
  // The harness overlay last: an entry whose input Assayer refused is DRIVEN from the colocated
  // `<basename>.harness.ts` under the SAME source root, so the Tests tab shows the supplied cases and the
  // Admissions tab stops naming a debt the reader has already paid. Read fresh per serve, never persisted.
  // `walked` is threaded (omitted, never `undefined`, under exactOptionalPropertyTypes) so a refusal
  // owned by a funnelled or through-caller private — invoiced against its host — can be paid here too,
  // exactly as the flat own-params payment already is; a missing `walked` (unreadable source) still runs
  // the broker, which degrades to that same flat payment on its own.
  return mapped === undefined || root === undefined
    ? mapped
    : harnessRealizeBroker({
        analysis: mapped,
        root,
        relPath,
        ...(walked === undefined ? {} : { walked }),
      });
};
