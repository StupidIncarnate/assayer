/**
 * Specimen: if-number-object-literal-arrow-property-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 27: never
 * - if else on line 27: never
 * - ternary then on line 27: never
 * - ternary else on line 27: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 27
 * - line 27
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const numberArrowPropertyCondNullishNumberValueExternal = {
    runArrow: (): string => {
        if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
            return 'then';
        }
        return 'else';
    },
};
