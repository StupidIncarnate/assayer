/**
 * Specimen: ternary-boolean-function-declaration-body-cond-not-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: driven
 * - ternary else on line 23: never
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
export function booleanBodyCondNotNumberValueExternal(): string {
    return !Number(process.argv[2]) ? 'then' : 'else';
}
