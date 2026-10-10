/**
 * Specimen: if-string-function-declaration-body-cond-param
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
export function stringBodyCondParam(cond: string): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
