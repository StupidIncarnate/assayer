/**
 * Specimen: if-number-generator-function-cond-array-length-number-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: never
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
const receiver: readonly number[] = [10, 20, 30];

export function* numberCondArrayLengthNumberReceiverConst(): Generator<string> {
    if (receiver.length) {
        yield 'then';
    }
    yield 'else';
}
