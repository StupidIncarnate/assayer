/**
 * Specimen: if-boolean-iife-cond-not-number-value-env
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
const value = Number(process.env.VALUE);

export const booleanCondNotNumberValueEnv = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
