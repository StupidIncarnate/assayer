/**
 * Specimen: if-boolean-iife-cond-not-boolean-value-env
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
const value = process.env.VALUE === 'true';

export const booleanCondNotBooleanValueEnv = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
