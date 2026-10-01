/**
 * PURPOSE: Defines the stub entry object whose `key` every contract and function that holds one reuses
 *
 * USAGE:
 * stubEntryContract.parse({ key: 'src/config/config.ts#Config' });
 * // Returns: StubEntry object
 */

import { z } from '#gateway/npm/zod';

export const stubEntryContract = z
  .object({
    key: z.string().min(1).brand<'StubEntryKey'>(),
  })
  .brand<'StubEntry'>();

export type StubEntry = z.infer<typeof stubEntryContract>;
