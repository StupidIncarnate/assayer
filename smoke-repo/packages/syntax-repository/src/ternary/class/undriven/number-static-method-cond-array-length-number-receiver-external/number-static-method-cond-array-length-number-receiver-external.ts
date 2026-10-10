/**
 * Specimen: ternary-number-class-static-method-cond-array-length-number-receiver-external
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
export class NumberStaticMethodCondArrayLengthNumberReceiverExternal {
    public static run(): string {
        return process.argv.slice(2).map(Number).length ? 'then' : 'else';
    }
}
