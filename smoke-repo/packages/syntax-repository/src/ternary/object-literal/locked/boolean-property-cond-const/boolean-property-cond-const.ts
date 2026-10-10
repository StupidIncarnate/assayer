/**
 * Specimen: ternary-boolean-object-literal-property-cond-const
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
const cond: boolean = true;

export const booleanPropertyCondConst = {
    label: cond ? 'then' : 'else',
};
