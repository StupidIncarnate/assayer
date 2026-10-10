/**
 * Specimen: ternary-boolean-iife-cond-gt-string-value-env
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
const value = process.env.VALUE ?? '';

export const booleanCondGtStringValueEnv = ((): string => {
    return value > 'm' ? 'then' : 'else';
})();
