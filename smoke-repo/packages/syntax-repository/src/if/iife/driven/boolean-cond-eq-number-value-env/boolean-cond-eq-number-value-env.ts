/**
 * Specimen: if-boolean-iife-cond-eq-number-value-env
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

export const booleanCondEqNumberValueEnv = ((): string => {
    if (value === 7) {
        return 'then';
    }
    return 'else';
})();
