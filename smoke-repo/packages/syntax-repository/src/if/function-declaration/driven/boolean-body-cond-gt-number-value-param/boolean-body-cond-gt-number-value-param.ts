/**
 * Specimen: if-boolean-function-declaration-body-cond-gt-number-value-param
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
export function booleanBodyCondGtNumberValueParam(value: number): string {
    if (value > 5) {
        return 'then';
    }
    return 'else';
}
