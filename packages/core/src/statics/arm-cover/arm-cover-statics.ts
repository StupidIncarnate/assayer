/**
 * PURPOSE: The size limit of the exact arm cover. A pass over more distinct candidate cases than this
 *   falls back to the greedy cover, because the exact search grows steeply with the candidate count.
 *
 * USAGE:
 * armCoverStatics.exactCandidateLimit; // 24
 */
export const armCoverStatics = {
  exactCandidateLimit: 24,
} as const;
