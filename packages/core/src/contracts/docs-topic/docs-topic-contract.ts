/**
 * PURPOSE: Contract for the `<topic>` argument of `assayer docs <topic>` — a non-empty
 *   documentation topic key.
 *
 * USAGE:
 * const topic = docsTopicContract.parse('overview');
 * // Returns a validated DocsTopic (branded)
 */
import { z } from 'zod';

export const docsTopicContract = z.string().min(1).brand<'DocsTopic'>();

export type DocsTopic = z.infer<typeof docsTopicContract>;
