/**
 * PURPOSE: Contract for a value use — ONE data flow a scope makes by BINDING an existing binding as a
 *   value (`const separator = sep`, `const p = process`), recorded as a LINK to what it references,
 *   never a copy. It is the value-read twin of a call site: where a call is an invocation, a value use
 *   is a plain reference that still moves data, so it earns the same loose-fact treatment (claimed by
 *   the enclosing scope on the way up) but carries NO arguments — nothing is invoked.
 *
 *   `target` classifies the referenced binding exactly as a callee link does: an `import` naming the
 *   module specifier its source is imported from plus the IMPORTED name (never the local alias), a
 *   same-file `local` function reference, or a `global` — an ambient identifier the hermetic walk
 *   cannot type (`process`, `console`), optionally with the accessed `member`. Following resolves the
 *   link; it never inlines the referenced value (P4).
 *
 * USAGE:
 * valueUseContract.parse({ target: 'import', specifier: 'node:path', importedName: 'sep' });
 * // Returns a validated ValueUse (branded fields)
 */
import { z } from 'zod';

import { lineNumberContract, moduleSpecifierContract, symbolNameContract } from '@assayer/shared/contracts';

export const valueUseContract = z.discriminatedUnion('target', [
  z.object({ target: z.literal('import'), specifier: moduleSpecifierContract, importedName: symbolNameContract }),
  z.object({ target: z.literal('local'), name: symbolNameContract, startLine: lineNumberContract }),
  z.object({ target: z.literal('global'), name: symbolNameContract, member: symbolNameContract.optional() }),
]);

export type ValueUse = z.infer<typeof valueUseContract>;
