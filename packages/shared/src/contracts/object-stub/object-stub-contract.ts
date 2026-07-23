/**
 * PURPOSE: Contract for an object stub — one stubbed object TYPE in the stub repository: its stable
 *   key, the definition it lives at, its name, its full property list spliced with per-property value
 *   demands (`property-demand`), and the repo-relative files that READ it (its readers). The reader
 *   set is the demanded-pair inventory a human uses to see which files a corrected value flows into.
 *
 *   `properties` mirrors the type's FULL declared shape — a property no reader branches on rides an
 *   `unknown` demand rather than being dropped, so the stub reads as the whole type, not just the
 *   parts some file happened to test.
 *
 * USAGE:
 * objectStubContract.parse({
 *   key: 'src/config/config.ts#Config', definitionRelPath: 'src/config/config.ts', typeName: 'Config',
 *   properties: [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }],
 *   readers: ['src/config/config.ts'],
 * });
 * // Returns a validated ObjectStub (branded fields)
 */
import { z } from 'zod';

import { propertyDemandContract } from '../property-demand/property-demand-contract';
import { relPathContract } from '../rel-path/rel-path-contract';
import { stubKeyContract } from '../stub-key/stub-key-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export const objectStubContract = z.object({
  key: stubKeyContract,
  definitionRelPath: relPathContract,
  typeName: symbolNameContract,
  properties: z.array(propertyDemandContract),
  readers: z.array(relPathContract),
});

export type ObjectStub = z.infer<typeof objectStubContract>;
