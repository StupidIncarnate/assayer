/**
 * Specimen: ternary-number-arrow-function-block-body-cond-string-length-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: never
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
export const numberBlockBodyCondStringLengthReceiverExternal = (): string => {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
};
