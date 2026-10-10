/**
 * Specimen: ternary-number-module-exported-const-cond-env
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
const cond = Number(process.env.COND);

export const numberExportedConstCondEnv = cond ? 'then' : 'else';
