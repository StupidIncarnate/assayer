/**
 * PURPOSE: Barrel export for @assayer/shared contracts — the cross-package status handshake and
 *   docs payload schemas, plus the compile-pipeline data model (config, cache manifest, compile
 *   result, and the compiled map/tree/blob shapes) consumed by core, the CLI, the desktop shell,
 *   and the renderer.
 *
 * USAGE:
 * import { statusResultContract, type StatusResult } from '@assayer/shared/contracts';
 */

// Subpath export entry for @assayer/shared/contracts

export * from './src/contracts/status-result/status-result-contract';
export * from './src/contracts/status-result/status-result.stub';

export * from './src/contracts/docs-topic/docs-topic-contract';
export * from './src/contracts/docs-topic/docs-topic.stub';

export * from './src/contracts/docs-result/docs-result-contract';
export * from './src/contracts/docs-result/docs-result.stub';

export * from './src/contracts/rel-path/rel-path-contract';
export * from './src/contracts/rel-path/rel-path.stub';

export * from './src/contracts/content-hash/content-hash-contract';
export * from './src/contracts/content-hash/content-hash.stub';

export * from './src/contracts/line-number/line-number-contract';
export * from './src/contracts/line-number/line-number.stub';

export * from './src/contracts/branch-name/branch-name-contract';
export * from './src/contracts/branch-name/branch-name.stub';

export * from './src/contracts/namespace-name/namespace-name-contract';
export * from './src/contracts/namespace-name/namespace-name.stub';

export * from './src/contracts/file-count/file-count-contract';
export * from './src/contracts/file-count/file-count.stub';

export * from './src/contracts/repo-name/repo-name-contract';
export * from './src/contracts/repo-name/repo-name.stub';

export * from './src/contracts/folder-name/folder-name-contract';
export * from './src/contracts/folder-name/folder-name.stub';

export * from './src/contracts/map-node-kind/map-node-kind-contract';
export * from './src/contracts/map-node-kind/map-node-kind.stub';

export * from './src/contracts/compile-status/compile-status-contract';
export * from './src/contracts/compile-status/compile-status.stub';

export * from './src/contracts/compile-mode/compile-mode-contract';
export * from './src/contracts/compile-mode/compile-mode.stub';

export * from './src/contracts/tree-node-kind/tree-node-kind-contract';
export * from './src/contracts/tree-node-kind/tree-node-kind.stub';

export * from './src/contracts/map-node/map-node-contract';
export * from './src/contracts/map-node/map-node.stub';

export * from './src/contracts/source-line/source-line-contract';
export * from './src/contracts/source-line/source-line.stub';

export * from './src/contracts/assayer-config/assayer-config-contract';
export * from './src/contracts/assayer-config/assayer-config.stub';

export * from './src/contracts/assayer-cache-manifest/assayer-cache-manifest-contract';
export * from './src/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';

export * from './src/contracts/compiled-file-blob/compiled-file-blob-contract';
export * from './src/contracts/compiled-file-blob/compiled-file-blob.stub';

export * from './src/contracts/compiled-file-view/compiled-file-view-contract';
export * from './src/contracts/compiled-file-view/compiled-file-view.stub';

export * from './src/contracts/compile-result/compile-result-contract';
export * from './src/contracts/compile-result/compile-result.stub';

export * from './src/contracts/compiled-tree/compiled-tree-contract';
export * from './src/contracts/compiled-tree/compiled-tree.stub';

export * from './src/contracts/coverage-id/coverage-id-contract';
export * from './src/contracts/coverage-id/coverage-id.stub';

export * from './src/contracts/representative-value/representative-value-contract';
export * from './src/contracts/representative-value/representative-value.stub';

export * from './src/contracts/predicate/predicate-contract';
export * from './src/contracts/predicate/predicate.stub';

export * from './src/contracts/type-text/type-text-contract';
export * from './src/contracts/type-text/type-text.stub';

export * from './src/contracts/type-descriptor/type-descriptor-contract';
export * from './src/contracts/type-descriptor/type-descriptor.stub';

export * from './src/contracts/symbol-name/symbol-name-contract';
export * from './src/contracts/symbol-name/symbol-name.stub';

export * from './src/contracts/guard-step/guard-step-contract';
export * from './src/contracts/guard-step/guard-step.stub';

export * from './src/contracts/param-descriptor/param-descriptor-contract';
export * from './src/contracts/param-descriptor/param-descriptor.stub';

export * from './src/contracts/branch-node/branch-node-contract';
export * from './src/contracts/branch-node/branch-node.stub';

export * from './src/contracts/exit-node/exit-node-contract';
export * from './src/contracts/exit-node/exit-node.stub';

export * from './src/contracts/derived-test-case/derived-test-case-contract';
export * from './src/contracts/derived-test-case/derived-test-case.stub';

export * from './src/contracts/line-enrichment/line-enrichment-contract';
export * from './src/contracts/line-enrichment/line-enrichment.stub';

export * from './src/contracts/entry-signature/entry-signature-contract';
export * from './src/contracts/entry-signature/entry-signature.stub';

export * from './src/contracts/function-analysis/function-analysis-contract';
export * from './src/contracts/function-analysis/function-analysis.stub';

export * from './src/contracts/file-analysis/file-analysis-contract';
export * from './src/contracts/file-analysis/file-analysis.stub';
