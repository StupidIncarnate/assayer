/**
 * Specimen: ternary-boolean-object-literal-property-cond-eq-boolean-value-env
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
const value = process.env.VALUE === 'true';

export const booleanPropertyCondEqBooleanValueEnv = {
    label: value === false ? 'then' : 'else',
};
