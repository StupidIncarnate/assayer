/**
 * Specimen: if-boolean-iife-cond-gt-string-value-env
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

export const booleanCondGtStringValueEnv = ((): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
})();
