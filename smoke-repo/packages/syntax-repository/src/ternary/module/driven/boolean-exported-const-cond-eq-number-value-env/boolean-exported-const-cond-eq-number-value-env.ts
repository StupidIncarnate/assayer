/**
 * Specimen: ternary-boolean-module-exported-const-cond-eq-number-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const value = Number(process.env.VALUE);

export const booleanExportedConstCondEqNumberValueEnv = value === 7 ? 'then' : 'else';
