/**
 * PURPOSE: Handles `assayer docs <topic>` — validates the topic, resolves it via core's docs
 *   broker, and returns the documentation body as CLI output.
 *
 * USAGE:
 * DocsShowResponder({ topic: 'overview' });
 * // Returns CliOutput (the doc body); throws on an unknown topic
 */
import { docsGetBroker } from '@assayer/core/brokers';


export const DocsShowResponder = ({ topic }: { topic: string }): string => {
  const docs = docsGetBroker({ topic: topic });

  return docs.body;
};
