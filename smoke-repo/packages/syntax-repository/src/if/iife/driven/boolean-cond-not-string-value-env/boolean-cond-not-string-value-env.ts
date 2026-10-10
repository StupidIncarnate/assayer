/**
 * Specimen: if-boolean-iife-cond-not-string-value-env
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
const value = process.env.VALUE ?? '';

export const booleanCondNotStringValueEnv = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
