/**
 * PURPOSE: Immutable display vocabulary for the compiled-surface explorer — what the surface says
 *   while the tree is being fetched, and when the fetch succeeded but there is nothing compiled.
 *
 *   Each sentence names the reader's NEXT MOVE, because that is the only thing the three surface
 *   states disagree about: waiting is not actionable, an empty surface is fixed by compiling one.
 *   Sharing "no tree" as their shape is what makes distinct wording load-bearing rather than
 *   decorative.
 *
 *   There is deliberately no sentence for the FAILED state. A failed fetch already carries the
 *   resolver's own error, which names the fault and where it is; a phrase here would either
 *   paraphrase text written to be acted on or bury it under a heading. The explorer prints that
 *   Error's message verbatim instead.
 *
 * USAGE:
 * surfaceExplorerStatics.emptyMessage;
 * // Returns 'No compiled surface — run assayer'
 */
export const surfaceExplorerStatics = {
  loadingMessage: 'Reading the compiled surface…',
  emptyMessage: 'No compiled surface — run assayer',
} as const;
