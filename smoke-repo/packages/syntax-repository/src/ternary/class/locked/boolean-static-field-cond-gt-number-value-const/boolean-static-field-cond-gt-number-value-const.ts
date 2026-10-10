/**
 * Specimen: ternary-boolean-class-static-field-cond-gt-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: never
 * - ternary else on line 25: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 25
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value: number = 3;

export class BooleanStaticFieldCondGtNumberValueConst {
    public static label = value > 5 ? 'then' : 'else';
}
