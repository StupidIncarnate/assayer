/**
 * Specimen: ternary-boolean-generator-function-cond-eq-boolean-value-external
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
export function* booleanCondEqBooleanValueExternal(): Generator<string> {
    yield process.argv[2] === 'yes' === false ? 'then' : 'else';
}
