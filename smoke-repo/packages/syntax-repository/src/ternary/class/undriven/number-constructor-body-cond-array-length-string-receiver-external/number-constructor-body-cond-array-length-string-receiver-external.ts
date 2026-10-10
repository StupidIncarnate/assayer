/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: one-way
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
        console.log(process.argv.slice(2).length ? 'then' : 'else');
    }
}
