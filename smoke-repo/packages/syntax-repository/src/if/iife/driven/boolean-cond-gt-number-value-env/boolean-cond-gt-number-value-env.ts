/**
 * Specimen: if-boolean-iife-cond-gt-number-value-env
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

export const booleanCondGtNumberValueEnv = ((): string => {
    if (value > 5) {
        return 'then';
    }
    return 'else';
})();
