/**
 * Specimen: ternary-number-generator-function-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
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
export function* numberCondArrayLengthNumberReceiverExternal(): Generator<string> {
    yield process.argv.slice(2).map(Number).length ? 'then' : 'else';
}
