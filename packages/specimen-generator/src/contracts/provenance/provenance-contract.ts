/**
 * PURPOSE: The ways a specimen's varying value can reach the code under test. Reach for this
 * whenever a file needs to say where a value came from, such as the generator's configs and the
 * manifest.
 *
 * USAGE:
 * provenanceContract.parse('param');
 * // Returns a Provenance
 */
import { z } from '#gateway/npm/zod';

export const provenanceContract = z.enum(['param', 'env', 'literal', 'const', 'random', 'external']);

export type Provenance = z.infer<typeof provenanceContract>;
