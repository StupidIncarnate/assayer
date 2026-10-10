/**
 * Specimen: ternary-boolean-class-getter-cond-gt-string-value-external
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
export class BooleanGetterCondGtStringValueExternal {
    public get result(): string {
        return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
    }
}
