/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-gt-number-value-const
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

export const booleanBlockBodyCondGtNumberValueConst = (): string => {
    return value > 5 ? 'then' : 'else';
};
