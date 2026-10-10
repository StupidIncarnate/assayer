/**
 * Specimen: if-boolean-function-expression-cond-not-number-value-param
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
export const booleanCondNotNumberValueParam = function (value: number): string {
    if (!value) {
        return 'then';
    }
    return 'else';
};
