/**
 * Specimen: ternary-number-default-export-cond-string-length-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 22: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 22
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const numberCondStringLengthReceiverExternal = (): string => {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
};

export default numberCondStringLengthReceiverExternal;
