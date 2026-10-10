/**
 * Specimen: ternary-number-class-static-method-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: never
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
export class NumberStaticMethodCondArrayLengthStringReceiverExternal {
    public static run(): string {
        return process.argv.slice(2).length ? 'then' : 'else';
    }
}
