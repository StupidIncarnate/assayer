/**
 * PURPOSE: Contract for one env-property read a file makes — a `process.env.<X>` access the walk
 *   captured, naming the property (`X`) and the literal(s) that property is directly compared against
 *   in a branch condition (`process.env.MODE === 'production'` carries `['production']`). A read that
 *   is not a direct comparison operand (`Number(process.env.CODE)`, or a bare `const m = process.env.MODE`)
 *   carries an empty `literals` — it still names the property, so the file is recorded as a reader.
 *
 *   It is the per-file raw half of the env stub the stitch aggregates: `process.env` is an object and
 *   each property is a slot whose values are GUESSED from the branch literals. It rides on the file's
 *   module graph beside `globalUses`, since an env read is a flat fact about the FILE, not a scope.
 *
 * USAGE:
 * envReadContract.parse({ property: 'MODE', literals: ['production'] });
 * // Returns a validated EnvRead (branded fields)
 */
import { z } from 'zod';

import { envVarNameContract } from '../env-var-name/env-var-name-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';

export const envReadContract = z.object({
  property: envVarNameContract,
  literals: z.array(representativeValueContract),
});

export type EnvRead = z.infer<typeof envReadContract>;
