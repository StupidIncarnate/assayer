/**
 * PURPOSE: Contract for a stub view — the derived stub index COMBINED with the committed overlay,
 *   computed fresh at display/consume time and NEVER persisted (the overlay is in no hash). Each object
 *   stub's per-property demanded values and each env stub's values reflect any human correction spliced
 *   over the derived demand; a property the overlay does not name keeps its derived demand. It is the
 *   shape the serve/UI layer reads — a valid `ObjectStub`/`EnvStub` per stub, corrected values in place.
 *
 * USAGE:
 * stubViewContract.parse({ objectStubs: [], envStubs: [] });
 * // Returns a validated StubView
 */
import { z } from 'zod';

import { envStubContract } from '../env-stub/env-stub-contract';
import { objectStubContract } from '../object-stub/object-stub-contract';

export const stubViewContract = z.object({
  objectStubs: z.array(objectStubContract),
  envStubs: z.array(envStubContract),
});

export type StubView = z.infer<typeof stubViewContract>;
