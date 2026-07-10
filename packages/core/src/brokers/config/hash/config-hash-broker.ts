/**
 * PURPOSE: Produces a deterministic content hash for an AssayerConfig by canonicalizing the
 *   version, repoRoot, and exclude fields (exclude order-independent) before hashing — the seam
 *   config-hash caching keys off. stableBranch is intentionally excluded: it drives which ref a
 *   diff reviews against, not what gets compiled.
 *
 * USAGE:
 * configHashBroker({ config: AssayerConfigStub() });
 * // Returns a validated ContentHash (sha256 digest of the canonicalized config fields)
 */
import type { AssayerConfig, ContentHash } from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';

export const configHashBroker = ({ config }: { config: AssayerConfig }): ContentHash => {
  const canonical = JSON.stringify({
    version: config.version,
    repoRoot: config.repoRoot,
    exclude: [...config.exclude].sort(),
  });

  return cryptoSha256Adapter({ content: canonical });
};
