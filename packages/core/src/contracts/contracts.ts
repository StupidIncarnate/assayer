/**
 * PURPOSE: Barrel export for @assayer/core contracts. It holds the compile-progress event streamed
 *   to the CLI during a compile, and the contracts the core analyzer produces and consumes: file
 *   contents, file-index entries, source positions and map-extraction results.
 *
 * USAGE:
 * import { compileProgressEventContract, type CompileProgressEvent } from '@assayer/core/contracts';
 */

// Subpath export entry for @assayer/core/contracts

export * from './compile-progress-event/compile-progress-event-contract';





export * from './file-index-entry/file-index-entry-contract';

export * from './source-position/source-position-contract';

export * from './map-extract-result/map-extract-result-contract';
