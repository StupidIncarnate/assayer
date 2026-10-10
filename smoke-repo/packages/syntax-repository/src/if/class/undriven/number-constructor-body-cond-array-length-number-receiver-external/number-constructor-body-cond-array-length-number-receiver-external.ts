/**
 * Specimen: if-number-class-constructor-body-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class NumberConstructorBodyCondArrayLengthNumberReceiverExternal {
    public constructor() {
        if (process.argv.slice(2).map(Number).length) {
            console.log('then');
        }
        console.log('else');
    }
}
