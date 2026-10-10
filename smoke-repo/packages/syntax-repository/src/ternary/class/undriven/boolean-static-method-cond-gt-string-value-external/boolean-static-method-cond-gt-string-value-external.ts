/**
 * Specimen: ternary-boolean-class-static-method-cond-gt-string-value-external
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
export class BooleanStaticMethodCondGtStringValueExternal {
    public static run(): string {
        return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
    }
}
