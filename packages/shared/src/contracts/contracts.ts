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

export * from './status-result/status-result-contract';
export * from './status-result/status-result.stub';

export * from './docs-topic/docs-topic-contract';
export * from './docs-topic/docs-topic.stub';

export * from './docs-result/docs-result-contract';
export * from './docs-result/docs-result.stub';

export * from './rel-path/rel-path-contract';
export * from './rel-path/rel-path.stub';

export * from './content-hash/content-hash-contract';
export * from './content-hash/content-hash.stub';

export * from './line-number/line-number-contract';
export * from './line-number/line-number.stub';

export * from './column-number/column-number-contract';
export * from './column-number/column-number.stub';

export * from './branch-name/branch-name-contract';
export * from './branch-name/branch-name.stub';

export * from './namespace-name/namespace-name-contract';
export * from './namespace-name/namespace-name.stub';

export * from './file-count/file-count-contract';
export * from './file-count/file-count.stub';

export * from './const-length/const-length-contract';
export * from './const-length/const-length.stub';

export * from './repo-name/repo-name-contract';
export * from './repo-name/repo-name.stub';

export * from './folder-name/folder-name-contract';
export * from './folder-name/folder-name.stub';

export * from './map-node-kind/map-node-kind-contract';
export * from './map-node-kind/map-node-kind.stub';

export * from './compile-status/compile-status-contract';
export * from './compile-status/compile-status.stub';

export * from './compile-mode/compile-mode-contract';
export * from './compile-mode/compile-mode.stub';

export * from './tree-node-kind/tree-node-kind-contract';
export * from './tree-node-kind/tree-node-kind.stub';

export * from './map-node/map-node-contract';
export * from './map-node/map-node.stub';

export * from './source-line/source-line-contract';
export * from './source-line/source-line.stub';

export * from './assayer-config/assayer-config-contract';
export * from './assayer-config/assayer-config.stub';

export * from './assayer-cache-manifest/assayer-cache-manifest-contract';
export * from './assayer-cache-manifest/assayer-cache-manifest.stub';

export * from './compiled-file-blob/compiled-file-blob-contract';
export * from './compiled-file-blob/compiled-file-blob.stub';

export * from './compiled-file-view/compiled-file-view-contract';
export * from './compiled-file-view/compiled-file-view.stub';

export * from './compile-result/compile-result-contract';
export * from './compile-result/compile-result.stub';

export * from './compiled-tree/compiled-tree-contract';
export * from './compiled-tree/compiled-tree.stub';

export * from './coverage-id/coverage-id-contract';
export * from './coverage-id/coverage-id.stub';

export * from './representative-value/representative-value-contract';
export * from './representative-value/representative-value.stub';

export * from './arrange-value/arrange-value-contract';
export * from './arrange-value/arrange-value.stub';

export * from './arrange-binding/arrange-binding-contract';
export * from './arrange-binding/arrange-binding.stub';

export * from './array-cardinality/array-cardinality-contract';
export * from './array-cardinality/array-cardinality.stub';

export * from './env-var-name/env-var-name-contract';
export * from './env-var-name/env-var-name.stub';

export * from './env-value/env-value-contract';
export * from './env-value/env-value.stub';

export * from './env-read/env-read-contract';
export * from './env-read/env-read.stub';

export * from './predicate/predicate-contract';
export * from './predicate/predicate.stub';

export * from './type-text/type-text-contract';
export * from './type-text/type-text.stub';

export * from './template-text/template-text-contract';
export * from './template-text/template-text.stub';

export * from './type-descriptor/type-descriptor-contract';
export * from './type-descriptor/type-descriptor.stub';

export * from './declared-type/declared-type-contract';
export * from './declared-type/declared-type.stub';

export * from './symbol-name/symbol-name-contract';
export * from './symbol-name/symbol-name.stub';

export * from './module-specifier/module-specifier-contract';
export * from './module-specifier/module-specifier.stub';

export * from './module-edge/module-edge-contract';
export * from './module-edge/module-edge.stub';

export * from './module-reference/module-reference-contract';
export * from './module-reference/module-reference.stub';

export * from './global-use/global-use-contract';
export * from './global-use/global-use.stub';

export * from './file-module-graph/file-module-graph-contract';
export * from './file-module-graph/file-module-graph.stub';

export * from './package-name/package-name-contract';
export * from './package-name/package-name.stub';

export * from './resolution-failure-reason/resolution-failure-reason-contract';
export * from './resolution-failure-reason/resolution-failure-reason.stub';

export * from './resolved-edge/resolved-edge-contract';
export * from './resolved-edge/resolved-edge.stub';

export * from './resolved-index/resolved-index-contract';
export * from './resolved-index/resolved-index.stub';

export * from './stub-key/stub-key-contract';
export * from './stub-key/stub-key.stub';

export * from './property-demand/property-demand-contract';
export * from './property-demand/property-demand.stub';

export * from './object-stub/object-stub-contract';
export * from './object-stub/object-stub.stub';

export * from './env-stub/env-stub-contract';
export * from './env-stub/env-stub.stub';

export * from './stub-index/stub-index-contract';
export * from './stub-index/stub-index.stub';

export * from './stub-overlay/stub-overlay-contract';
export * from './stub-overlay/stub-overlay.stub';

export * from './stub-view/stub-view-contract';
export * from './stub-view/stub-view.stub';

export * from './harness-input-key/harness-input-key-contract';
export * from './harness-input-key/harness-input-key.stub';

export * from './harness-file/harness-file-contract';
export * from './harness-file/harness-file.stub';

export * from './harness-index/harness-index-contract';
export * from './harness-index/harness-index.stub';

export * from './harness-key-path/harness-key-path-contract';
export * from './harness-key-path/harness-key-path.stub';

export * from './external-signature/external-signature-contract';
export * from './external-signature/external-signature.stub';

export * from './syntax-kind-name/syntax-kind-name-contract';
export * from './syntax-kind-name/syntax-kind-name.stub';

export * from './dark-spot/dark-spot-contract';
export * from './dark-spot/dark-spot.stub';

export * from './undriven-entry/undriven-entry-contract';
export * from './undriven-entry/undriven-entry.stub';

export * from './lint-entry/lint-entry-contract';
export * from './lint-entry/lint-entry.stub';

export * from './entry-gap/entry-gap-contract';
export * from './entry-gap/entry-gap.stub';

export * from './guard-step/guard-step-contract';
export * from './guard-step/guard-step.stub';

export * from './param-descriptor/param-descriptor-contract';
export * from './param-descriptor/param-descriptor.stub';

export * from './condition-leaf/condition-leaf-contract';
export * from './condition-leaf/condition-leaf.stub';

export * from './condition-node/condition-node-contract';
export * from './condition-node/condition-node.stub';

export * from './branch-node/branch-node-contract';
export * from './branch-node/branch-node.stub';

export * from './exit-node/exit-node-contract';
export * from './exit-node/exit-node.stub';

export * from './derived-test-case/derived-test-case-contract';
export * from './derived-test-case/derived-test-case.stub';

export * from './arrange-text/arrange-text-contract';
export * from './arrange-text/arrange-text.stub';

export * from './entry-label/entry-label-contract';
export * from './entry-label/entry-label.stub';

export * from './anonymous-reach/anonymous-reach-contract';
export * from './anonymous-reach/anonymous-reach.stub';

export * from './line-enrichment/line-enrichment-contract';
export * from './line-enrichment/line-enrichment.stub';

export * from './entry-access/entry-access-contract';
export * from './entry-access/entry-access.stub';

export * from './entry-signature/entry-signature-contract';
export * from './entry-signature/entry-signature.stub';

export * from './declaring-scope/declaring-scope-contract';
export * from './declaring-scope/declaring-scope.stub';

export * from './function-analysis/function-analysis-contract';
export * from './function-analysis/function-analysis.stub';

export * from './file-analysis/file-analysis-contract';
export * from './file-analysis/file-analysis.stub';

export * from './trace-value-text/trace-value-text-contract';
export * from './trace-value-text/trace-value-text.stub';

export * from './trace-event/trace-event-contract';
export * from './trace-event/trace-event.stub';

export * from './case-result/case-result-contract';
export * from './case-result/case-result.stub';

export * from './run-id/run-id-contract';
export * from './run-id/run-id.stub';

export * from './run-result/run-result-contract';
export * from './run-result/run-result.stub';

export * from './run-console/run-console-contract';
export * from './run-console/run-console.stub';

