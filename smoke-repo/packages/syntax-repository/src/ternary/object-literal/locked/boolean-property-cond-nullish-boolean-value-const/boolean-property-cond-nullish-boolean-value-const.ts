/**
 * Specimen: ternary-boolean-object-literal-property-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: never
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
const value: boolean | undefined = true;

export const booleanPropertyCondNullishBooleanValueConst = {
    label: value ?? false ? 'then' : 'else',
};
