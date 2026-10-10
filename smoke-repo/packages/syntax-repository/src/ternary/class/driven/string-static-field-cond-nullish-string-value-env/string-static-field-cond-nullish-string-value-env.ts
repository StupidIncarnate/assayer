/**
 * Specimen: ternary-string-class-static-field-cond-nullish-string-value-env
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
const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

export class StringStaticFieldCondNullishStringValueEnv {
    public static label = value ?? '' ? 'then' : 'else';
}
