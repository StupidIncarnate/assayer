/**
 * PURPOSE: Contract for an environment variable's NAME — the key a module scope reads its input
 *   from, and therefore the key a derived case sets to drive that scope down a chosen path.
 *
 *   It is its own contract rather than a `SymbolName` because it is not one: a symbol name addresses
 *   a binding inside the program's own namespace, while this addresses a slot in the process
 *   environment. They are never interchangeable — the local `value` in
 *   `const value = Number(process.env.VALUE)` and the variable `VALUE` are different names for
 *   different things, and a type that let one be passed where the other belongs would make setting
 *   the wrong key a silent runtime miss rather than a compile error.
 *
 * USAGE:
 * envVarNameContract.parse('VALUE');
 * // Returns a validated EnvVarName (branded)
 */
import { z } from 'zod';

export const envVarNameContract = z.string().min(1).brand<'EnvVarName'>();

export type EnvVarName = z.infer<typeof envVarNameContract>;
