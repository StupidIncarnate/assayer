/**
 * Specimen: ternary-number-class-static-method-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 27: never
 * - ternary then on line 27: never
 * - ternary else on line 27: never
 * - ternary else on line 27: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 27
 * - line 27
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class NumberStaticMethodCondNullishNumberValueExternal {
    public static run(): string {
        return (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else';
    }
}
