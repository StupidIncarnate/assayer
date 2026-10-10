/**
 * Specimen: ternary-string-arrow-function-block-body-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export const stringBlockBodyCondNullishStringValueConst = (): string => {
    return value ?? '' ? 'then' : 'else';
};
