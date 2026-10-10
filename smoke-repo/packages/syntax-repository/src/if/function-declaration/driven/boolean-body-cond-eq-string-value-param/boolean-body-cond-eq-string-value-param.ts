/**
 * Specimen: if-boolean-function-declaration-body-cond-eq-string-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
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
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
