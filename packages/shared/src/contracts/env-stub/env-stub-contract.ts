/**
 * PURPOSE: Contract for an env stub — one `process.env` property in the stub repository. `process.env`
 *   is an object like any other, and each property (`MODE`, `CODE`) is a slot whose `values` are GUESSED
 *   from the branch literals the files that read it test against it, plus a synthetic representative for
 *   the "anything else" the opaque source could be. `guessed` marks the whole set as best-effort — a
 *   human correcting a value flips no flag here, the correction lives in the committed overlay — and
 *   `readers` are the repo-relative files that read the property, the inventory a human uses to see
 *   which files a corrected value flows into. It rides beside the object stubs in the same index.
 *
 * USAGE:
 * envStubContract.parse({
 *   key: 'process.env#MODE', property: 'MODE', values: ['abc123', 'production'],
 *   guessed: true, readers: ['src/config/config.ts'],
 * });
 * // Returns a validated EnvStub (branded fields)
 */
import { z } from 'zod';

import { envVarNameContract } from '../env-var-name/env-var-name-contract';
import { relPathContract } from '../rel-path/rel-path-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';
import { stubKeyContract } from '../stub-key/stub-key-contract';

export const envStubContract = z.object({
  key: stubKeyContract,
  property: envVarNameContract,
  values: z.array(representativeValueContract),
  guessed: z.boolean(),
  readers: z.array(relPathContract),
});

export type EnvStub = z.infer<typeof envStubContract>;
