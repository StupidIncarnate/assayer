/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 26: never
 * - ternary then on line 26: never
 * - ternary else on line 26: never
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 26
 * - line 26
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanBlockBodyCondNullishBooleanValueExternal = (): string => {
    return (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else';
};
