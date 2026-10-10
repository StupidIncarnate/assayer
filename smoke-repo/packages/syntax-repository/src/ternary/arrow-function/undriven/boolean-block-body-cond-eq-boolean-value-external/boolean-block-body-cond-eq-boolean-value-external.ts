/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-eq-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanBlockBodyCondEqBooleanValueExternal = (): string => {
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
};
