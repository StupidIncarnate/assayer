/**
 * PURPOSE: Validates an unknown value against the assayer config contract, returning either the
 *   validated AssayerConfig or a field-keyed list of validation issues.
 *
 * USAGE:
 * const result = configValidateBroker({ config: { version: '1', repoRoot: '.', exclude: [] } });
 * // Returns { success: true, config: AssayerConfig } or
 * // { success: false, issues: [{ path: ErrorMessage, message: ErrorMessage }] }
 */
import { assayerConfigContract } from '@assayer/shared/contracts';
import type { AssayerConfig } from '@assayer/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

export const configValidateBroker = ({
  config,
}: {
  config: unknown;
}):
  | { success: true; config: AssayerConfig }
  | { success: false; issues: { path: ErrorMessage; message: ErrorMessage }[] } => {
  const result = assayerConfigContract.safeParse(config);

  if (result.success) {
    return { success: true, config: result.data };
  }

  return {
    success: false,
    issues: result.error.issues.map((issue) => ({
      path: errorMessageContract.parse(issue.path.join('.')),
      message: errorMessageContract.parse(issue.message),
    })),
  };
};
