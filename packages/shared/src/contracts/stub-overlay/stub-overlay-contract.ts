/**
 * PURPOSE: Contract for a stub overlay entry — one COMMITTED human correction to the derived stub
 *   index, living at `assayer/stubs/` OUTSIDE the cache. It keys on the SAME stable `StubKey` the
 *   derived stub uses (`<definitionRelPath>#<TypeName>` for an object, `process.env#<PROPERTY>` for
 *   env), so a correction addresses the same stub across runs. The overlay and the derived stub combine
 *   at display/consume time and are NEVER persisted merged; the overlay is in NO hash, so editing it
 *   never invalidates the derived cache. An `object` correction REPLACES the demanded values of each
 *   property it names — properties it does not name keep their derived demand; an `env` correction
 *   REPLACES the property's values. `overlayPath` is the committed file the correction lives in — the
 *   file a stale-entry build error names.
 *
 * USAGE:
 * stubOverlayContract.parse({
 *   kind: 'object', key: 'src/config/config.ts#Config',
 *   overlayPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
 *   properties: [{ name: 'mode', values: ['dev', 'prod', 'staging'] }],
 * });
 * // Returns a validated StubOverlay (branded fields)
 */
import { z } from 'zod';

import { envVarNameContract } from '../env-var-name/env-var-name-contract';
import { relPathContract } from '../rel-path/rel-path-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';
import { stubKeyContract } from '../stub-key/stub-key-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export const stubOverlayContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('object'),
    key: stubKeyContract,
    overlayPath: relPathContract,
    properties: z.array(z.object({ name: symbolNameContract, values: z.array(representativeValueContract) })),
  }),
  z.object({
    kind: z.literal('env'),
    key: stubKeyContract,
    overlayPath: relPathContract,
    property: envVarNameContract,
    values: z.array(representativeValueContract),
  }),
]);

export type StubOverlay = z.infer<typeof stubOverlayContract>;
