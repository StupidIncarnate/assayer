/**
 * Specimen: ternary-boolean-class-static-field-cond-eq-string-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: driven
 *
 * Expected lint errors:
 * - none
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
const value = process.env.VALUE ?? '';

export class BooleanStaticFieldCondEqStringValueEnv {
    public static label = value === 'xyz' ? 'then' : 'else';
}
