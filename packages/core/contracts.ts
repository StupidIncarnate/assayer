/**
 * PURPOSE: Barrel export for @assayer/core contracts — the status handshake and docs
 *   payload schemas. Core owns these; other packages reach them through adapters or
 *   via return-type inference (never a direct broker/responder/widget import).
 *
 * USAGE:
 * import { statusResultContract, type StatusResult } from '@assayer/core/contracts';
 */

// Subpath export entry for @assayer/core/contracts

export * from './src/contracts/status-result/status-result-contract';
export * from './src/contracts/status-result/status-result.stub';

export * from './src/contracts/docs-topic/docs-topic-contract';
export * from './src/contracts/docs-topic/docs-topic.stub';

export * from './src/contracts/docs-result/docs-result-contract';
export * from './src/contracts/docs-result/docs-result.stub';
