/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-array-length-boolean-receiver-external
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
export const numberArrowPropertyCondArrayLengthBooleanReceiverExternal = {
    runArrow: (): string => {
        return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
    },
};
