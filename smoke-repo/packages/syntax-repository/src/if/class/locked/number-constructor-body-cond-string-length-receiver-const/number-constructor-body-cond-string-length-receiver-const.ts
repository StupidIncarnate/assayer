/**
 * Specimen: if-number-class-constructor-body-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 26: driven
 * - if else on line 26: never
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
const receiver: string = 'abc';

export class NumberConstructorBodyCondStringLengthReceiverConst {
    public constructor() {
        if (receiver.length) {
            console.log('then');
        }
        console.log('else');
    }
}
