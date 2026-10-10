/**
 * Specimen: ternary-string-module-exported-const-cond-nullish-string-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
 * - ternary then on line 26: driven
 * - ternary else on line 26: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

export const stringExportedConstCondNullishStringValueEnv = value ?? '' ? 'then' : 'else';
