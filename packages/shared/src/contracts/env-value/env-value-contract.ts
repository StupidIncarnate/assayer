/**
 * PURPOSE: Contract for the VALUE a derived case writes to an environment variable — always a
 *   string, because the process environment holds nothing else.
 *
 *   That is why it is not a `RepresentativeValue`. A representative value is a point in an operand's
 *   type domain (the number `6` for `value > 5`); this is the text that, once the source's own
 *   coercion has run over it, YIELDS that point. Keeping them separate keeps the arrange honest: the
 *   case says `VALUE="6"`, which is exactly what a human would type to reproduce it, rather than
 *   `VALUE=6`, which is a value the environment cannot hold.
 *
 * USAGE:
 * envValueContract.parse('6');
 * // Returns a validated EnvValue (branded)
 */
import { z } from 'zod';

export const envValueContract = z.string().brand<'EnvValue'>();

export type EnvValue = z.infer<typeof envValueContract>;
