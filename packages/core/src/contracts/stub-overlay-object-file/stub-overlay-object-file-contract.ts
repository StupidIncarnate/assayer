/**
 * PURPOSE: Contract for the on-disk shape of a committed OBJECT stub overlay file
 *   (`assayer/stubs/objects/<definitionRelPath>/<TypeName>.json`) — the human-authored correction as it
 *   is written to disk: the type identity it addresses and, per named property, the values that REPLACE
 *   the derived demand. The file PATH carries the authoritative stub identity; this validates the file's
 *   content shape when the overlay is loaded.
 *
 * USAGE:
 * stubOverlayObjectFileContract.parse({
 *   type: 'src/config/config.ts#Config',
 *   properties: { mode: { values: ['dev', 'prod', 'staging'] } },
 * });
 * // Returns a validated StubOverlayObjectFile
 */
import { z } from 'zod';
import { representativeValueContract, stubKeyContract, symbolNameContract } from '@assayer/shared/contracts';

export const stubOverlayObjectFileContract = z.object({
  type: stubKeyContract,
  properties: z.record(symbolNameContract, z.object({ values: z.array(representativeValueContract) })),
});

export type StubOverlayObjectFile = z.infer<typeof stubOverlayObjectFileContract>;
