/**
 * Specimen: ternary-number-class-constructor-body-cond-string-length-receiver-const
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
const receiver: string = 'abc';

export class NumberConstructorBodyCondStringLengthReceiverConst {
    public constructor() {
        console.log(receiver.length ? 'then' : 'else');
    }
}
