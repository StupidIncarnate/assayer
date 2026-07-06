/**
 * PURPOSE: Barrel export for @assayer/desktop test proxies — consumed by the CLI's launch
 *   adapter proxy (via `@assayer/desktop/testing`).
 *
 * USAGE:
 * import { desktopLaunchBrokerProxy } from '@assayer/desktop/testing';
 */

// Subpath export entry for @assayer/desktop/testing

export * from './src/brokers/desktop/launch/desktop-launch-broker.proxy';
