/**
 * Specimen: ternary-number-module-exported-const-cond-env
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
const cond = Number(process.env.COND);

export const numberExportedConstCondEnv = cond ? 'then' : 'else';
