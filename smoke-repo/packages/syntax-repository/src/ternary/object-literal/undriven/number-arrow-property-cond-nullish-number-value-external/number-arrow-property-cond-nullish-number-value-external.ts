/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 25: never
 * - ternary on line 25: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 25
 * - line 25
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberArrowPropertyCondNullishNumberValueExternal = {
    runArrow: (): string => {
        return (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else';
    },
};
