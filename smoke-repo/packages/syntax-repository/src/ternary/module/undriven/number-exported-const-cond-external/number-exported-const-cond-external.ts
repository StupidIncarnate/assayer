/**
 * Specimen: ternary-number-module-exported-const-cond-external
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
export const numberExportedConstCondExternal = Number(process.argv[2]) ? 'then' : 'else';
