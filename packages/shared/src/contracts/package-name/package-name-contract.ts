/**
 * PURPOSE: Contract for an npm/node package name — where a resolved edge points when its definition
 *   lives outside the repo (`react`, `@scope/pkg`, `fs`). It is derived from the module specifier by
 *   dropping any subpath and the `node:` scheme, never spelled by hand: the resolver classifies a
 *   package/builtin edge under this name, and a later slice attaches the package's declared types.
 *
 * USAGE:
 * packageNameContract.parse('react');
 * // Returns a validated PackageName (branded)
 */
import { z } from 'zod';

export const packageNameContract = z.string().min(1).brand<'PackageName'>();

export type PackageName = z.infer<typeof packageNameContract>;
