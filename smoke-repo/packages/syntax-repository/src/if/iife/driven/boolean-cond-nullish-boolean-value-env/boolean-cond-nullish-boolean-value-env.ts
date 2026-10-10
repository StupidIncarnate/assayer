/**
 * Specimen: if-boolean-iife-cond-nullish-boolean-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
 * - if on line 25: both-ways
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
const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

export const booleanCondNullishBooleanValueEnv = ((): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
})();
