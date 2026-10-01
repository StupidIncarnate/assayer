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

export * from './docs-topic/docs-topic-contract';

export * from './docs-result/docs-result-contract';

export * from './rel-path/rel-path-contract';

export * from './content-hash/content-hash-contract';

export * from './line-number/line-number-contract';

export * from './column-number/column-number-contract';

export * from './branch-name/branch-name-contract';

export * from './namespace-name/namespace-name-contract';

export * from './file-count/file-count-contract';

export * from './const-length/const-length-contract';

export * from './repo-name/repo-name-contract';

export * from './folder-name/folder-name-contract';

export * from './map-node-kind/map-node-kind-contract';

export * from './compile-status/compile-status-contract';

export * from './compile-mode/compile-mode-contract';

export * from './tree-node-kind/tree-node-kind-contract';

export * from './map-node/map-node-contract';

export * from './source-line/source-line-contract';

export * from './assayer-config/assayer-config-contract';

export * from './assayer-cache-manifest/assayer-cache-manifest-contract';

export * from './compiled-file-blob/compiled-file-blob-contract';

export * from './compiled-file-view/compiled-file-view-contract';

export * from './compile-result/compile-result-contract';

export * from './compiled-tree/compiled-tree-contract';


export * from './representative-value/representative-value-contract';

export * from './arrange-value/arrange-value-contract';

export * from './arrange-binding/arrange-binding-contract';

export * from './array-cardinality/array-cardinality-contract';

export * from './env-var-name/env-var-name-contract';

export * from './env-value/env-value-contract';

export * from './env-read/env-read-contract';

export * from './predicate/predicate-contract';

export * from './type-text/type-text-contract';

export * from './template-text/template-text-contract';

export * from './type-descriptor/type-descriptor-contract';

export * from './declared-type/declared-type-contract';


export * from './module-specifier/module-specifier-contract';

export * from './module-edge/module-edge-contract';

export * from './module-reference/module-reference-contract';

export * from './global-use/global-use-contract';

export * from './file-module-graph/file-module-graph-contract';

export * from './package-name/package-name-contract';

export * from './resolution-failure-reason/resolution-failure-reason-contract';

export * from './resolved-edge/resolved-edge-contract';

export * from './resolved-index/resolved-index-contract';


export * from './property-demand/property-demand-contract';

export * from './object-stub/object-stub-contract';

export * from './env-stub/env-stub-contract';

export * from './stub-index/stub-index-contract';

export * from './stub-overlay/stub-overlay-contract';

export * from './stub-view/stub-view-contract';

export * from './harness-input-key/harness-input-key-contract';

export * from './harness-file/harness-file-contract';

export * from './harness-index/harness-index-contract';

export * from './harness-key-path/harness-key-path-contract';

export * from './external-signature/external-signature-contract';

export * from './syntax-kind-name/syntax-kind-name-contract';

export * from './dark-spot/dark-spot-contract';

export * from './undriven-entry/undriven-entry-contract';

export * from './lint-entry/lint-entry-contract';

export * from './entry-gap/entry-gap-contract';

export * from './guard-step/guard-step-contract';

export * from './param-descriptor/param-descriptor-contract';

export * from './condition-leaf/condition-leaf-contract';

export * from './condition-node/condition-node-contract';

export * from './branch-node/branch-node-contract';

export * from './exit-node/exit-node-contract';

export * from './derived-test-case/derived-test-case-contract';


export * from './entry-label/entry-label-contract';

export * from './anonymous-reach/anonymous-reach-contract';

export * from './line-enrichment/line-enrichment-contract';

export * from './entry-access/entry-access-contract';

export * from './entry-signature/entry-signature-contract';

export * from './declaring-scope/declaring-scope-contract';

export * from './function-analysis/function-analysis-contract';

export * from './file-analysis/file-analysis-contract';

export * from './trace-value-text/trace-value-text-contract';

export * from './trace-event/trace-event-contract';

export * from './case-result/case-result-contract';


export * from './run-result/run-result-contract';

export * from './coverage/coverage-contract';
export * from './stub-entry/stub-entry-contract';
