/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-string-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: driven
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 26
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

export class NumberConstructorBodyCondArrayLengthStringReceiverConst {
    public constructor() {
        console.log(receiver.length ? 'then' : 'else');
    }
}
