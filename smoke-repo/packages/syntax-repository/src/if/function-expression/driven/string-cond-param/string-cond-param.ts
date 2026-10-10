/**
 * Specimen: if-string-function-expression-cond-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: driven
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
export const stringCondParam = function (cond: string): string {
    if (cond) {
        return 'then';
    }
    return 'else';
};
