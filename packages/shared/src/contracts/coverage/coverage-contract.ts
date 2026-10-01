/**
 * PURPOSE: Defines the coverage object whose `id` every contract and function that holds one reuses
 *
 * USAGE:
 * coverageContract.parse({ id: 'formatGreeting/if:name.length===0' });
 * // Returns: Coverage object
 */

import { z } from '#gateway/npm/zod';

export const coverageContract = z
  .object({
    id: z.string().min(1).brand<'CoverageId'>(),
  })
  .brand<'Coverage'>();

export type Coverage = z.infer<typeof coverageContract>;
