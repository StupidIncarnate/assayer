/**
 * PURPOSE: Projects the walk's normalized model into the file's module graph — the persisted, raw
 *   half of the cross-file graph a later stitch pass resolves. Like the analysis and map projections,
 *   it is a PURE function of the single walk, so a file is parsed once and read many ways.
 *
 *   `edges` are the file's import/re-export declarations, taken verbatim from the walk. `references`
 *   are every call into an imported name — each `scope.calls` entry whose callee resolved to an
 *   `import` link — deduped by (specifier, importedName) so a symbol called ten times is one
 *   reference, carrying the FIRST call's position (where the stitch anchors an unresolvable-import
 *   error). Positions are the only formatting-sensitive field and are display-only: the reference
 *   IDENTITY (specifier + imported name) is invariant under reformatting, exactly like a coverage ID.
 *
 * USAGE:
 * moduleGraphProjectionTransformer({ walked });
 * // Returns a validated FileModuleGraph: { edges: [...], references: [...] }
 */
import { fileModuleGraphContract } from '@assayer/shared/contracts';
import type { FileModuleGraph, ModuleReference } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';

export const moduleGraphProjectionTransformer = ({ walked }: { walked: WalkFileResult }): FileModuleGraph => {
  if (!walked.success) {
    return fileModuleGraphContract.parse({ edges: [], references: [], globalUses: [] });
  }

  const referenced = walked.scopes.flatMap((scope) =>
    scope.calls.flatMap((call) =>
      call.callee.target === 'import'
        ? [
            {
              specifier: call.callee.specifier,
              importedName: call.callee.importedName,
              line: call.position.line,
              column: call.position.column,
            },
          ]
        : [],
    ),
  );

  // Dedup by (specifier, importedName), keeping the first occurrence's position. A file references
  // only a handful of imported names, so the linear membership check is cheap.
  const references = referenced.reduce<ModuleReference[]>(
    (unique, reference) =>
      unique.some((seen) => seen.specifier === reference.specifier && seen.importedName === reference.importedName)
        ? unique
        : [...unique, reference],
    [],
  );

  // Global uses ride verbatim from the walk's flat channel, deduped by (name, member, called) so an
  // ambient identifier used ten times is one use, keeping the FIRST occurrence's position (where the
  // stitch anchors a no-usable-types error). Their identity (name + member) is invariant under
  // reformatting, exactly like a reference's.
  const globalUses = walked.globalUses.reduce<typeof walked.globalUses>(
    (unique, use) =>
      unique.some(
        (seen) => seen.name === use.name && seen.member === use.member && seen.called === use.called,
      )
        ? unique
        : [...unique, use],
    [],
  );

  return fileModuleGraphContract.parse({ edges: walked.moduleEdges, references, globalUses });
};
