/**
 * Specimen: if-boolean-iife-cond-not-number-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value = Number(process.env.VALUE);

export const booleanCondNotNumberValueEnv = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
