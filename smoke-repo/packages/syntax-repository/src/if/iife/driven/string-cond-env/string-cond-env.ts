/**
 * Specimen: if-string-iife-cond-env
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
const cond = process.env.COND ?? '';

export const stringCondEnv = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
