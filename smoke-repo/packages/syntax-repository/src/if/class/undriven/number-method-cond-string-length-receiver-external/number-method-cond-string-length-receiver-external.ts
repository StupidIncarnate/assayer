/**
 * Specimen: if-number-class-method-cond-string-length-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
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
export class NumberMethodCondStringLengthReceiverExternal {
    public run(): string {
        if ((process.argv[2] ?? '').length) {
            return 'then';
        }
        return 'else';
    }
}
