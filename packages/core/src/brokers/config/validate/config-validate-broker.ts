/**
 * PURPOSE: Validates an unknown value against the assayer config contract, returning either the
 *   validated AssayerConfig or a field-keyed list of validation issues.
 *
 * USAGE:
 * const result = configValidateBroker({ config: { version: '1', repoRoot: '.', exclude: [] } });
 * // Returns { success: true, config: AssayerConfig } or
 * // { success: false, issues: [{ path: string, message: string }] }
 */
import { configValidateResultContract } from '../../../contracts/config-validate-result/config-validate-result-contract';
import type { ConfigValidateResult } from '../../../contracts/config-validate-result/config-validate-result-contract';
import { assayerConfigContract } from '@assayer/shared/contracts';

export const configValidateBroker = ({
  config,
}: {
  config: unknown;
}):
  ConfigValidateResult => {
  const result = assayerConfigContract.safeParse(config);

  if (result.success) {
    return configValidateResultContract.parse({ success: true, config: result.data });
  }

  return configValidateResultContract.parse({
    success: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  });
};
