/**
 * PURPOSE: Contract for a module specifier — the literal string a module reference names its source
 *   with (`'./other'`, `'react'`, `'node:fs'`), taken from the import/export declaration's
 *   module-specifier VALUE, never its quoted spelling. It is the raw, unresolved key a later stitch
 *   pass resolves to a canonical definition site; the walk only records it.
 *
 * USAGE:
 * moduleSpecifierContract.parse('./other');
 * // Returns a validated ModuleSpecifier (branded)
 */
import { z } from 'zod';

export const moduleSpecifierContract = z.string().min(1).brand<'ModuleSpecifier'>();

export type ModuleSpecifier = z.infer<typeof moduleSpecifierContract>;
