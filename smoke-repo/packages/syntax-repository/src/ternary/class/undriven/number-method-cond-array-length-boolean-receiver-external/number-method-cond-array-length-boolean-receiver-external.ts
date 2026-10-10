/**
 * Specimen: ternary-number-class-method-cond-array-length-boolean-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
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
export class NumberMethodCondArrayLengthBooleanReceiverExternal {
    public run(): string {
        return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
    }
}
