/**
 * Specimen: ternary-number-default-export-cond-array-length-string-receiver-external
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
const numberCondArrayLengthStringReceiverExternal = (): string => {
    return process.argv.slice(2).length ? 'then' : 'else';
};

export default numberCondArrayLengthStringReceiverExternal;
