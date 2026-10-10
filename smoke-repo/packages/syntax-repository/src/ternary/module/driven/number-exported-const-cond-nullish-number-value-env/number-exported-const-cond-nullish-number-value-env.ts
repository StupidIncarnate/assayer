/**
 * Specimen: ternary-number-module-exported-const-cond-nullish-number-value-env
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
const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

export const numberExportedConstCondNullishNumberValueEnv = value ?? 0 ? 'then' : 'else';
