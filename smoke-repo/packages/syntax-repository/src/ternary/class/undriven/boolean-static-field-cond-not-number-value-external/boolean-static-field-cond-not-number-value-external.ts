/**
 * Specimen: ternary-boolean-class-static-field-cond-not-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class BooleanStaticFieldCondNotNumberValueExternal {
    public static label = !Number(process.argv[2]) ? 'then' : 'else';
}
