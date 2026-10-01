/**
 * PURPOSE: Contract for the result of `assayer docs <topic>` — the requested topic plus the
 *   resolved, LLM-consumable documentation body.
 *
 * USAGE:
 * docsResultContract.parse({ topic: docsTopicContract.parse('overview'), body: '# Assayer' });
 * // Returns a validated DocsResult (branded fields)
 */
import { z } from '#gateway/npm/zod';


export const docsResultContract = z.object({
  topic: z.string().min(1).brand<'DocsResultTopic'>(),
  body: z.string().min(1).brand<'DocsBody'>(),
});

export type DocsResult = z.infer<typeof docsResultContract>;
