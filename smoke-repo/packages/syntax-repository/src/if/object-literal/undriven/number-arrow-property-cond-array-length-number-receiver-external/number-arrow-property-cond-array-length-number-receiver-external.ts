/**
 * Specimen: if-number-object-literal-arrow-property-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
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
export const numberArrowPropertyCondArrayLengthNumberReceiverExternal = {
    runArrow: (): string => {
        if (process.argv.slice(2).map(Number).length) {
            return 'then';
        }
        return 'else';
    },
};
