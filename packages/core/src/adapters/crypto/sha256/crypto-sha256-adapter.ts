/**
 * PURPOSE: Computes a deterministic SHA-256 hex digest of UTF-8 content, validated as the
 *   branded ContentHash contract used to key the content-hash cache.
 *
 * USAGE:
 * cryptoSha256Adapter({ content: 'abc' });
 * // Returns a validated ContentHash (lowercase 64-hex sha256 digest)
 */
import { createHash } from 'node:crypto';
import { contentHashContract } from '@assayer/shared/contracts';
import type { ContentHash } from '@assayer/shared/contracts';

export const cryptoSha256Adapter = ({ content }: { content: string }): ContentHash =>
  contentHashContract.parse(createHash('sha256').update(content, 'utf8').digest('hex'));
