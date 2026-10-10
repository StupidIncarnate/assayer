/**
 * Specimen: ternary-boolean-module-exported-const-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 21: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const booleanExportedConstCondNotBooleanValueExternal = !(process.argv[2] === 'yes') ? 'then' : 'else';
