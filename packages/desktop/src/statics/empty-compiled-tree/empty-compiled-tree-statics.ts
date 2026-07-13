/**
 * PURPOSE: Placeholder summary values for the EMPTY compiled tree returned when no cache manifest
 *   exists yet (dev / first run before any `assayer` compile). The explorer never renders the
 *   header on an empty tree — nodes.length === 0 short-circuits to the empty-state terminal — so
 *   these are contract-valid stand-ins, never user-visible: 'default' identity segments and zero
 *   TS/TSX counts.
 *
 * USAGE:
 * emptyCompiledTreeStatics.summary.repoName;   // 'default'
 * emptyCompiledTreeStatics.summary.tsCount;    // 0
 */
export const emptyCompiledTreeStatics = {
  summary: {
    repoName: 'default',
    branchName: 'default',
    rootFolderName: 'default',
    tsCount: 0,
    tsxCount: 0,
  },
} as const;
