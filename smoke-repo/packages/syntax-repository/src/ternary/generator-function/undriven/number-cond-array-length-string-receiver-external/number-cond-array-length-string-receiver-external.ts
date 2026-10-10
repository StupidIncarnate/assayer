/**
 * Specimen: ternary-number-generator-function-cond-array-length-string-receiver-external
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
export function* numberCondArrayLengthStringReceiverExternal(): Generator<string> {
    yield process.argv.slice(2).length ? 'then' : 'else';
}
