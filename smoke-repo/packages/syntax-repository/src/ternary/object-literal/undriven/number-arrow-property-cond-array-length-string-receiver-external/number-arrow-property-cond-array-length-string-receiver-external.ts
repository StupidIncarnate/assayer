/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberArrowPropertyCondArrayLengthStringReceiverExternal = {
    runArrow: (): string => {
        return process.argv.slice(2).length ? 'then' : 'else';
    },
};
