/**
 * PURPOSE: Contract for the stub index — the DERIVED, per-namespace product of the stub stitch: every
 *   stubbed object TYPE (its full property list spliced with per-property value demands, plus the files
 *   that read it) and, once the env rung lands, every `process.env` property. A TWIN of the resolved
 *   index — not content-keyed like a blob but keyed on `layoutHash` + `tsconfigHash`, so it rebuilds
 *   whenever the file set or tsconfig changes and is written atomically to
 *   `.assayer/cache/stubs/<namespace>.json`. Both arrays are canonically sorted for byte-identical
 *   serialization; `envStubs` is empty until the env aggregation rung fills it.
 *
 * USAGE:
 * stubIndexContract.parse({
 *   layoutHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   tsconfigHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   objectStubs: [], envStubs: [],
 * });
 * // Returns a validated StubIndex (branded fields)
 */
import { z } from 'zod';

import { contentHashContract } from '../content-hash/content-hash-contract';
import { envStubContract } from '../env-stub/env-stub-contract';
import { objectStubContract } from '../object-stub/object-stub-contract';

export const stubIndexContract = z.object({
  layoutHash: contentHashContract,
  tsconfigHash: contentHashContract,
  objectStubs: z.array(objectStubContract),
  envStubs: z.array(envStubContract),
});

export type StubIndex = z.infer<typeof stubIndexContract>;
