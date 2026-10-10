/**
 * Specimen: if-number-class-constructor-body-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class NumberConstructorBodyCondArrayLengthStringReceiverExternal {
    public constructor() {
        if (process.argv.slice(2).length) {
            console.log('then');
        }
        console.log('else');
    }
}
