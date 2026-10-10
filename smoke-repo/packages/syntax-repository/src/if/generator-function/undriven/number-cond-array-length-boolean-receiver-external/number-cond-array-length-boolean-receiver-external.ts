/**
 * Specimen: if-number-generator-function-cond-array-length-boolean-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: never
 * - if else on line 23: driven
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
export function* numberCondArrayLengthBooleanReceiverExternal(): Generator<string> {
    if (process.argv.slice(2).map(arg => arg === 'yes').length) {
        yield 'then';
    }
    yield 'else';
}
