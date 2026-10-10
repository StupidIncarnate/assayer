/**
 * Specimen: ternary-boolean-module-exported-const-cond-gt-string-value-external
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
export const booleanExportedConstCondGtStringValueExternal = (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
