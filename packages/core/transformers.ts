/**
 * PURPOSE: Barrel export for @assayer/core transformers — the pure projections the desktop main
 *   process reads at serve time. `stubViewTransformer` combines the DERIVED stub index (read from the
 *   cache) with the COMMITTED `assayer/stubs/` overlay into the merged StubView the `/stubs` view
 *   renders, computed fresh per read and never persisted.
 *
 * USAGE:
 * import { stubViewTransformer } from '@assayer/core/transformers';
 */

// Subpath export entry for @assayer/core/transformers

export * from './src/transformers/stub-view/stub-view-transformer';
