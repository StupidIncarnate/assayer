/**
 * Specimen: ternary-boolean-class-field-cond-eq-string-value-external
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
export class BooleanFieldCondEqStringValueExternal {
    public label = (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
}
