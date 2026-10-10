/**
 * Specimen: ternary-boolean-class-static-field-cond-nullish-boolean-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
 * - ternary then on line 27: driven
 * - ternary else on line 27: driven
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
const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

export class BooleanStaticFieldCondNullishBooleanValueEnv {
    public static label = value ?? false ? 'then' : 'else';
}
