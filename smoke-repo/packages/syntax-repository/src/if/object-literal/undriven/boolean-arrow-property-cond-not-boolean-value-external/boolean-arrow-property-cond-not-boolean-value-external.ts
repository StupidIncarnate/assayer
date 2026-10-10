/**
 * Specimen: if-boolean-object-literal-arrow-property-cond-not-boolean-value-external
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
export const booleanArrowPropertyCondNotBooleanValueExternal = {
    runArrow: (): string => {
        if (!(process.argv[2] === 'yes')) {
            return 'then';
        }
        return 'else';
    },
};
