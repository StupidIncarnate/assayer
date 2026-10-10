/**
 * Specimen: ternary-boolean-module-exported-const-cond-not-number-value-env
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

export const booleanExportedConstCondNotNumberValueEnv = !value ? 'then' : 'else';
