/**
 * Specimen: ternary-number-default-export-cond-array-length-number-receiver-external
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
const numberCondArrayLengthNumberReceiverExternal = (): string => {
    return process.argv.slice(2).map(Number).length ? 'then' : 'else';
};

export default numberCondArrayLengthNumberReceiverExternal;
