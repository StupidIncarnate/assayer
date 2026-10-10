/**
 * Specimen: if-boolean-iife-cond-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 24: both-ways
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
const cond = process.env.COND === 'true';

export const booleanCondEnv = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
