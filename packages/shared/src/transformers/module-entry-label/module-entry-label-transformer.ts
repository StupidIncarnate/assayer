/**
 * PURPOSE: Renders the human LABEL for a module-scope entry — the name a surface shows instead of the
 *   internal `*module*` scope root. A module scope is reached by IMPORTING it, so it takes no args and
 *   never reads as a call: the label is a bare name, never `name(params)`.
 *
 *   The label is the single exported top-level binding the module's tracked flow is attached to
 *   (`message`, `separator`, `full`) when there is exactly one such export; otherwise — a side-effect
 *   call like `console.log(...)` with no export, or several exports — it falls back to the file
 *   basename WITH extension (`uses-console.ts`). It is shared because BOTH surfaces (the CLI report and
 *   the desktop panel) must name one module the same way, and because the same rule labels a driven
 *   module entry and an undriven one.
 *
 *   DISPLAY only: it never touches identity. Coverage IDs and the scope path stay `*module*`-rooted —
 *   the label is what a reader sees, not what the cache keys on.
 *
 * USAGE:
 * moduleEntryLabelTransformer({ exportName, relPath: 'src/import-local/uses-greeting.ts' });
 * // Returns 'message' when exportName is set, else 'uses-greeting.ts'
 */
import { symbolNameContract } from '../../contracts/symbol-name/symbol-name-contract';
import type { SymbolName } from '../../contracts/symbol-name/symbol-name-contract';

export const moduleEntryLabelTransformer = ({
  exportName,
  relPath,
}: {
  exportName?: SymbolName;
  relPath: string;
}): SymbolName => {
  if (exportName !== undefined) {
    return exportName;
  }

  const basename = relPath.split('/').filter((segment) => segment.length > 0).at(-1);

  return symbolNameContract.parse(basename === undefined || basename.length === 0 ? relPath : basename);
};
