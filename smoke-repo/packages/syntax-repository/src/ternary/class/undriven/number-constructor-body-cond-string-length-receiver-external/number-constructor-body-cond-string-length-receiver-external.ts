/**
 * Specimen: ternary-number-class-constructor-body-cond-string-length-receiver-external
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
export class NumberConstructorBodyCondStringLengthReceiverExternal {
    public constructor() {
        console.log((process.argv[2] ?? '').length ? 'then' : 'else');
    }
}
