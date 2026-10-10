/**
 * Specimen: ternary-number-default-export-cond-string-length-receiver-external
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
const numberCondStringLengthReceiverExternal = (): string => {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
};

export default numberCondStringLengthReceiverExternal;
