/**
 * PURPOSE: Immutable top-level CLI usage banner — the single source of truth for the
 *   text shown by `assayer help` and printed alongside unrecognized-command errors.
 *
 * USAGE:
 * cliUsageStatics.text;
 * // Returns the full usage banner listing all top-level commands
 */
export const cliUsageStatics = {
  text: 'Usage: assayer <command>\n\nCommands:\n  status   Show assayer version and core status\n  docs     Print documentation (assayer docs [topic])\n  help     Show this usage information\n  version  Print the assayer version',
} as const;
