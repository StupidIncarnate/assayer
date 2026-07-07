/**
 * PURPOSE: Resolves an assayer documentation topic to its LLM-consumable body, or throws a
 *   P1-grade error naming the available topics. Backs the `assayer docs <topic>` command.
 *
 * USAGE:
 * docsGetBroker({ topic: docsTopicContract.parse('overview') });
 * // Returns a validated DocsResult { topic, body }; throws on an unknown topic
 */
import { docsResultContract } from '@assayer/shared/contracts';
import type { DocsResult, DocsTopic } from '@assayer/shared/contracts';

import { docsCatalogStatics } from '../../../statics/docs-catalog/docs-catalog-statics';

export const docsGetBroker = ({ topic }: { topic: DocsTopic }): DocsResult => {
  const requested = String(topic);
  const match = docsCatalogStatics.topics.find((entry) => entry.key === requested);

  if (match === undefined) {
    const available = docsCatalogStatics.topics.map((entry) => entry.key).join(', ');
    throw new Error(`Unknown docs topic "${requested}". Available topics: ${available}.`);
  }

  return docsResultContract.parse({ topic, body: match.body });
};
