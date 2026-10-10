/**
 * Specimen: if-number-class-static-method-cond-string-length-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: driven
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
export class NumberStaticMethodCondStringLengthReceiverExternal {
    public static run(): string {
        if ((process.argv[2] ?? '').length) {
            return 'then';
        }
        return 'else';
    }
}
