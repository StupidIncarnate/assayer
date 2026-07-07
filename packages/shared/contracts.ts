/**
 * PURPOSE: Barrel export for @assayer/shared contracts — the cross-package status handshake and
 *   docs payload schemas consumed by core, the CLI, and the desktop shell.
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
