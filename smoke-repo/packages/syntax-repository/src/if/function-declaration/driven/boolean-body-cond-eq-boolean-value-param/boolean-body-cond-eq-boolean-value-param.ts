/**
 * Specimen: if-boolean-function-declaration-body-cond-eq-boolean-value-param
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
export function booleanBodyCondEqBooleanValueParam(value: boolean): string {
    if (value === false) {
        return 'then';
    }
    return 'else';
}
