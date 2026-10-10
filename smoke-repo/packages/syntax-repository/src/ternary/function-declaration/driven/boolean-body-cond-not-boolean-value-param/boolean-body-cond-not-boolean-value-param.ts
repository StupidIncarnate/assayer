/**
 * Specimen: ternary-boolean-function-declaration-body-cond-not-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function booleanBodyCondNotBooleanValueParam(value: boolean): string {
    return !value ? 'then' : 'else';
}
