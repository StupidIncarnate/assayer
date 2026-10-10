/**
 * Specimen: if-boolean-iife-cond-gt-number-value-env
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

export const booleanCondGtNumberValueEnv = ((): string => {
    if (value > 5) {
        return 'then';
    }
    return 'else';
})();
