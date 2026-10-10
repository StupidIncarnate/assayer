/**
 * Specimen: ternary-string-iife-cond-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 24: both-ways
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

export const stringCondEnv = ((): string => {
    return cond ? 'then' : 'else';
})();
