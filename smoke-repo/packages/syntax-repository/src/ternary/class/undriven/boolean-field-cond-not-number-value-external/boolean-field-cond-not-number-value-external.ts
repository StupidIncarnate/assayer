/**
 * Specimen: ternary-boolean-class-field-cond-not-number-value-external
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
export class BooleanFieldCondNotNumberValueExternal {
    public label = !Number(process.argv[2]) ? 'then' : 'else';
}
