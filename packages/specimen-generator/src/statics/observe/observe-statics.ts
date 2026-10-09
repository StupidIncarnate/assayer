/**
 * PURPOSE: The fixed settings the observe broker uses to run Assayer on one specimen. The core
 * path is counted from `src/brokers/specimen/observe/`: five `..` segments reach `packages/`, and
 * `core` is the package beside this one.
 *
 * USAGE:
 * observeStatics.cache.dirPrefix;
 * // Returns 'assayer-specimen-observe-'
 */
export const observeStatics = {
  cache: {
    dirPrefix: 'assayer-specimen-observe-',
    analyzerContentHash: 'specimen-generator-pinned-hash',
  },
  runId: {
    hashLength: 16,
  },
  corePathSegments: ['..', '..', '..', '..', '..', 'core'],
} as const;
