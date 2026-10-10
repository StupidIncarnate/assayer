/**
 * Specimen: if-number-iife-cond-env
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
const cond = Number(process.env.COND);

export const numberCondEnv = ((): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
})();
