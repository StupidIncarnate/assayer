/**
 * Specimen: if-string-function-declaration-body-cond-nullish-string-value-param
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
export function stringBodyCondNullishStringValueParam(value: string | undefined): string {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
}
