/**
 * Specimen: ternary-string-object-literal-arrow-property-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const stringArrowPropertyCondExternal = {
    runArrow: (): string => {
        return process.argv[2] ?? '' ? 'then' : 'else';
    },
};
