/**
 * Specimen: if-number-iife-cond-nullish-number-value-env
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
const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

export const numberCondNullishNumberValueEnv = ((): string => {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
})();
