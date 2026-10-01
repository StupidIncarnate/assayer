/**
 * PURPOSE: Formats Zod validation issues into a single CLI error message — one "path: message" line
 *   per issue, in the order given, so every failing field is visible at once.
 *
 * USAGE:
 * zodErrorMessageFormatTransformer({
 *   issues: [{ path: 'repoRoot', message: 'Invalid input: expected string, received number' }],
 * });
 * // Returns 'repoRoot: Invalid input: expected string, received number'
 */

export const zodErrorMessageFormatTransformer = ({
  issues,
}: {
  issues: readonly { path: string; message: string }[];
}): string => {
  return issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
};
