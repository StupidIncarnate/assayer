/**
 * Specimen: ternary-string-class-static-method-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
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
export class StringStaticMethodCondExternal {
    public static run(): string {
        return process.argv[2] ?? '' ? 'then' : 'else';
    }
}
