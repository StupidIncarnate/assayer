/**
 * Specimen: if-number-class-static-method-cond-array-length-boolean-receiver-external
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
export class NumberStaticMethodCondArrayLengthBooleanReceiverExternal {
    public static run(): string {
        if (process.argv.slice(2).map(arg => arg === 'yes').length) {
            return 'then';
        }
        return 'else';
    }
}
