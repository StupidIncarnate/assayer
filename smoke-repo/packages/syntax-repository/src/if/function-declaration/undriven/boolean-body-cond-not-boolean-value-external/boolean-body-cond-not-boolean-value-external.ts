/**
 * Specimen: if-boolean-function-declaration-body-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function booleanBodyCondNotBooleanValueExternal(): string {
    if (!(process.argv[2] === 'yes')) {
        return 'then';
    }
    return 'else';
}
