/**
 * PURPOSE: Immutable assayer release metadata — the single source of truth for the
 *   version reported by the CLI and the desktop status panel.
 *
 * USAGE:
 * assayerVersionStatics.release.version;
 * // Returns '1.0.0'
 */
export const assayerVersionStatics = {
  release: {
    version: '1.0.0',
  },
} as const;
