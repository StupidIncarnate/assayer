/**
 * Specimen: if-boolean-function-declaration-body-cond-not-string-value-param
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
export function booleanBodyCondNotStringValueParam(value: string): string {
    if (!value) {
        return 'then';
    }
    return 'else';
}
