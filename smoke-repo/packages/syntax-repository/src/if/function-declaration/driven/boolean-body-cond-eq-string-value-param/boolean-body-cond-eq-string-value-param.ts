/**
 * Specimen: if-boolean-function-declaration-body-cond-eq-string-value-param
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
export function booleanBodyCondEqStringValueParam(value: string): string {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
