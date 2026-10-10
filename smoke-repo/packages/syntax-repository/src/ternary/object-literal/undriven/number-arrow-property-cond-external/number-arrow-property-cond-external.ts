/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-external
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
export const numberArrowPropertyCondExternal = {
    runArrow: (): string => {
        return Number(process.argv[2]) ? 'then' : 'else';
    },
};
