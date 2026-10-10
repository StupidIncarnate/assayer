/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-boolean-receiver-const
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
const receiver: readonly boolean[] = [true, false, true];

export class NumberConstructorBodyCondArrayLengthBooleanReceiverConst {
    public constructor() {
        console.log(receiver.length ? 'then' : 'else');
    }
}
