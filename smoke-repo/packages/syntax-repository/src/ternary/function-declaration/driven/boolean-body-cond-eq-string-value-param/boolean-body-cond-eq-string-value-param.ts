/**
 * Specimen: ternary-boolean-function-declaration-body-cond-eq-string-value-param
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
export function booleanBodyCondEqStringValueParam(value: string): string {
    return value === 'xyz' ? 'then' : 'else';
}
