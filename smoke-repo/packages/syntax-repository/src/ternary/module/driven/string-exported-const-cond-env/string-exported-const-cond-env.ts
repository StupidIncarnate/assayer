/**
 * Specimen: ternary-string-module-exported-const-cond-env
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
const cond = process.env.COND ?? '';

export const stringExportedConstCondEnv = cond ? 'then' : 'else';
