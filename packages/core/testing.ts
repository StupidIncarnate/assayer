/**
 * PURPOSE: Barrel export for @assayer/core test proxies — consumed by other packages' proxies
 *   (via `@assayer/core/testing`) so they can compose core's broker proxies in tests.
 *
 * USAGE:
 * import { statusGetBrokerProxy } from '@assayer/core/testing';
 */

// Subpath export entry for @assayer/core/testing

export * from './src/brokers/status/get/status-get-broker.proxy';
export * from './src/brokers/docs/get/docs-get-broker.proxy';
