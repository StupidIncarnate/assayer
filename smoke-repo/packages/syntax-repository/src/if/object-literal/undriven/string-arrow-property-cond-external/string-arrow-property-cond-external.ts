/**
 * Specimen: if-string-object-literal-arrow-property-cond-external
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
export const stringArrowPropertyCondExternal = {
    runArrow: (): string => {
        if (process.argv[2] ?? '') {
            return 'then';
        }
        return 'else';
    },
};
