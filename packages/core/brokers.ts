/**
 * PURPOSE: Barrel export for @assayer/core brokers — the core "seams" the CLI and the
 *   desktop main process call (status + docs). Grows into the analyzer/rule engine.
 *
 * USAGE:
 * import { statusGetBroker, docsGetBroker } from '@assayer/core/brokers';
 */

// Subpath export entry for @assayer/core/brokers

export * from './src/brokers/status/get/status-get-broker';
export * from './src/brokers/docs/get/docs-get-broker';
