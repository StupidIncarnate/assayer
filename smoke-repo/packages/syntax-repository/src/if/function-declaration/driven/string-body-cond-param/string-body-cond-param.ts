/**
 * Specimen: if-string-function-declaration-body-cond-param
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
export function stringBodyCondParam(cond: string): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
