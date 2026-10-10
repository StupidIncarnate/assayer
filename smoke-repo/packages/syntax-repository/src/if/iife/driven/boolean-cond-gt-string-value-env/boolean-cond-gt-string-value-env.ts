/**
 * Specimen: if-boolean-iife-cond-gt-string-value-env
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
const value = process.env.VALUE ?? '';

export const booleanCondGtStringValueEnv = ((): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
})();
