/**
 * Specimen: ternary-boolean-module-exported-const-cond-eq-string-value-env
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
const value = process.env.VALUE ?? '';

export const booleanExportedConstCondEqStringValueEnv = value === 'xyz' ? 'then' : 'else';
