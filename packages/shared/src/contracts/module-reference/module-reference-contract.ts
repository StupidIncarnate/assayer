/**
 * PURPOSE: Contract for a module reference — a USE of an imported name (a call to it), recorded as
 *   the raw cross-file reference (the module specifier its source is imported from plus the IMPORTED
 *   name, never the local alias) paired with the position of the use. It is the called half of the
 *   module graph: where an edge proves a module is imported, a reference proves an imported symbol is
 *   consumed, and its line/column is where a later stitch pass anchors an unresolvable/opaque-import
 *   build error (P1) — at the call site, the place a reader acts on.
 *
 * USAGE:
 * moduleReferenceContract.parse({ specifier: './other', importedName: 'foo', line: 5, column: 10 });
 * // Returns a validated ModuleReference (branded fields)
 */
import { z } from 'zod';

import { columnNumberContract } from '../column-number/column-number-contract';
import { lineNumberContract } from '../line-number/line-number-contract';
import { moduleSpecifierContract } from '../module-specifier/module-specifier-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export const moduleReferenceContract = z.object({
  specifier: moduleSpecifierContract,
  importedName: symbolNameContract,
  line: lineNumberContract,
  column: columnNumberContract,
});

export type ModuleReference = z.infer<typeof moduleReferenceContract>;
