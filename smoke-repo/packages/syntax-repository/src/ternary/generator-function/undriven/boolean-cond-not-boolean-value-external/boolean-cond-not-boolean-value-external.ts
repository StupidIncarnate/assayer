/**
 * Specimen: ternary-boolean-generator-function-cond-not-boolean-value-external
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
export function* booleanCondNotBooleanValueExternal(): Generator<string> {
    yield !(process.argv[2] === 'yes') ? 'then' : 'else';
}
