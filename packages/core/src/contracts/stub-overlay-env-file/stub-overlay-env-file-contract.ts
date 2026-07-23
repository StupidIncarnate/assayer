/**
 * PURPOSE: Contract for the on-disk shape of a committed ENV stub overlay file
 *   (`assayer/stubs/env/<PROPERTY>.json`) — the human-authored correction as it is written to disk: the
 *   `process.env` source, the property it addresses, and the values that REPLACE the guessed demand. The
 *   file PATH carries the authoritative stub identity; this validates the file's content shape when the
 *   overlay is loaded.
 *
 * USAGE:
 * stubOverlayEnvFileContract.parse({ source: 'process.env', property: 'CODE', values: ['1', '2', 'other'] });
 * // Returns a validated StubOverlayEnvFile
 */
import { z } from 'zod';
import { envVarNameContract, representativeValueContract } from '@assayer/shared/contracts';

export const stubOverlayEnvFileContract = z.object({
  source: z.literal('process.env'),
  property: envVarNameContract,
  values: z.array(representativeValueContract),
});

export type StubOverlayEnvFile = z.infer<typeof stubOverlayEnvFileContract>;
