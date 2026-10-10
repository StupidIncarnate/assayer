/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-number-receiver-external
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
export class NumberConstructorBodyCondArrayLengthNumberReceiverExternal {
    public constructor() {
        console.log(process.argv.slice(2).map(Number).length ? 'then' : 'else');
    }
}
