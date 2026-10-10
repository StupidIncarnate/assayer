/**
 * Specimen: ternary-string-class-static-field-cond-nullish-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 26: never
 * - ternary then on line 26: never
 * - ternary else on line 26: never
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 26
 * - line 26
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class StringStaticFieldCondNullishStringValueExternal {
    public static label = (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
}
