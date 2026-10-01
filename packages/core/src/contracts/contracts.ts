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

export * from './compile-progress-event/compile-progress-event-contract';
export * from './compile-progress-event/compile-progress-event.stub';

export * from './file-path/file-path-contract';
export * from './file-path/file-path.stub';

export * from './file-contents/file-contents-contract';
export * from './file-contents/file-contents.stub';

export * from './dir-entry/dir-entry-contract';
export * from './dir-entry/dir-entry.stub';

export * from './git-exec-result/git-exec-result-contract';
export * from './git-exec-result/git-exec-result.stub';

export * from './file-index-entry/file-index-entry-contract';
export * from './file-index-entry/file-index-entry.stub';

export * from './source-position/source-position-contract';
export * from './source-position/source-position.stub';

export * from './map-extract-result/map-extract-result-contract';
export * from './map-extract-result/map-extract-result.stub';
