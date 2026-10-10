/**
 * Specimen: ternary-boolean-class-method-cond-not-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: never
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
export class BooleanMethodCondNotStringValueExternal {
    public run(): string {
        return !(process.argv[2] ?? '') ? 'then' : 'else';
    }
}
