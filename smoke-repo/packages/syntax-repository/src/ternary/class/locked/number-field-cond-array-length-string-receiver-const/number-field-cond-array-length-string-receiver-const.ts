/**
 * Specimen: ternary-number-class-field-cond-array-length-string-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 25
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
const receiver: readonly string[] = ['a', 'b', 'c'];

export class NumberFieldCondArrayLengthStringReceiverConst {
    public label = receiver.length ? 'then' : 'else';
}
