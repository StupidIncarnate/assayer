/**
 * PURPOSE: Adapter boundary to the @assayer/core docs seam — validates a raw topic argument
 *   and returns the resolved documentation, keeping cross-package imports out of responders.
 *
 * USAGE:
 * assayerCoreDocsAdapter({ topic: 'overview' });
 * // Returns the core DocsResult { topic, body }; throws on an unknown topic
 */
import { docsGetBroker } from '@assayer/core/brokers';
import { docsTopicContract } from '@assayer/core/contracts';
import type { DocsResult } from '@assayer/core/contracts';

export const assayerCoreDocsAdapter = ({ topic }: { topic: string }): DocsResult =>
  docsGetBroker({ topic: docsTopicContract.parse(topic) });
