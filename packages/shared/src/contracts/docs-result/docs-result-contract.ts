/**
 * PURPOSE: Contract for the result of `assayer docs <topic>` — the requested topic plus the
 *   resolved, LLM-consumable documentation body.
 *
 * USAGE:
 * docsResultContract.parse({ topic: docsTopicContract.parse('overview'), body: '# Assayer' });
 * // Returns a validated DocsResult (branded fields)
 */
import { z } from 'zod';

import { docsTopicContract } from '../docs-topic/docs-topic-contract';

export const docsResultContract = z.object({
  topic: docsTopicContract,
  body: z.string().min(1).brand<'DocsBody'>(),
});

export type DocsResult = z.infer<typeof docsResultContract>;
