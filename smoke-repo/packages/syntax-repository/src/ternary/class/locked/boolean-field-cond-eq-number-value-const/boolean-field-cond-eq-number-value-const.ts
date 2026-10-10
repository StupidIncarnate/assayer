/**
 * Specimen: ternary-boolean-class-field-cond-eq-number-value-const
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

export class BooleanFieldCondEqNumberValueConst {
    public label = value === 7 ? 'then' : 'else';
}
