/**
 * Specimen: ternary-number-object-literal-method-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: never
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
export const numberMethodCondExternal = {
    run(): string {
        return Number(process.argv[2]) ? 'then' : 'else';
    },
};
