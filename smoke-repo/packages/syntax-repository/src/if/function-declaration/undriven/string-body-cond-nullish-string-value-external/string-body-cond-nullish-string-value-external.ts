/**
 * Specimen: if-string-function-declaration-body-cond-nullish-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 26: never
 * - if else on line 26: driven
 * - ternary then on line 26: never
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 26
 * - line 26
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function stringBodyCondNullishStringValueExternal(): string {
    if ((process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '') {
        return 'then';
    }
    return 'else';
}
