/**
 * PURPOSE: Barrel export for @assayer/core contracts — the compile-progress event streamed to
 *   the CLI during a compile, plus the adapter/transformer I/O contracts (filesystem paths, file
 *   contents, directory entries, git exec results, file-index entries, source positions, and
 *   map-extraction results) the core analyzer produces and consumes.
 *
 * USAGE:
 * import { compileProgressEventContract, type CompileProgressEvent } from '@assayer/core/contracts';
 */

// Subpath export entry for @assayer/core/contracts

export * from './src/contracts/compile-progress-event/compile-progress-event-contract';
export * from './src/contracts/compile-progress-event/compile-progress-event.stub';

export * from './src/contracts/file-path/file-path-contract';
export * from './src/contracts/file-path/file-path.stub';

export * from './src/contracts/file-contents/file-contents-contract';
export * from './src/contracts/file-contents/file-contents.stub';

export * from './src/contracts/dir-entry/dir-entry-contract';
export * from './src/contracts/dir-entry/dir-entry.stub';

export * from './src/contracts/git-exec-result/git-exec-result-contract';
export * from './src/contracts/git-exec-result/git-exec-result.stub';

export * from './src/contracts/file-index-entry/file-index-entry-contract';
export * from './src/contracts/file-index-entry/file-index-entry.stub';

export * from './src/contracts/source-position/source-position-contract';
export * from './src/contracts/source-position/source-position.stub';

export * from './src/contracts/map-extract-result/map-extract-result-contract';
export * from './src/contracts/map-extract-result/map-extract-result.stub';
