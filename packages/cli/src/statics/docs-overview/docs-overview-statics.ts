/**
 * PURPOSE: Immutable overview documentation text served by `assayer docs overview` (and
 *   the default `assayer docs` topic) — the single source of truth for the top-level
 *   description of what assayer does.
 *
 * USAGE:
 * docsOverviewStatics.text;
 * // Returns the overview documentation paragraph
 */
export const docsOverviewStatics = {
  text: 'Assayer is a test enforcement and generation tool for TypeScript repos. Run `assayer` to open the compiled surface explorer, `assayer status` to check the compiled cache, and `assayer docs <topic>` for topic-specific documentation (e.g. `assayer docs overview`, `assayer docs plugins`).',
} as const;
