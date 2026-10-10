/**
 * Specimen: if-boolean-function-expression-cond-eq-number-value-param
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
export const booleanCondEqNumberValueParam = function (value: number): string {
    if (value === 7) {
        return 'then';
    }
    return 'else';
};
