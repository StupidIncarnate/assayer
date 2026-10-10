/**
 * Specimen: ternary-number-class-constructor-body-cond-string-length-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
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
export class NumberConstructorBodyCondStringLengthReceiverParam {
    public constructor(receiver: string) {
        console.log(receiver.length ? 'then' : 'else');
    }
}
