/**
 * Specimen: ternary-number-object-literal-property-cond-const
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
const cond: number = 3;

export const numberPropertyCondConst = {
    label: cond ? 'then' : 'else',
};
