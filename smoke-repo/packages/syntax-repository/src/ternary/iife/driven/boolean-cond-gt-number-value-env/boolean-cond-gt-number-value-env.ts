/**
 * Specimen: ternary-boolean-iife-cond-gt-number-value-env
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
const value = Number(process.env.VALUE);

export const booleanCondGtNumberValueEnv = ((): string => {
    return value > 5 ? 'then' : 'else';
})();
