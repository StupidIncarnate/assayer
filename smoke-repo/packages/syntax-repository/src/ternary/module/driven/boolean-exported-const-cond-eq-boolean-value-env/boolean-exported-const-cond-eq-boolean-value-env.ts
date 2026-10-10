/**
 * Specimen: ternary-boolean-module-exported-const-cond-eq-boolean-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
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
const value = process.env.VALUE === 'true';

export const booleanExportedConstCondEqBooleanValueEnv = value === false ? 'then' : 'else';
