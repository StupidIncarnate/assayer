/**
 * Specimen: if-number-object-literal-method-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 25: never
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
export const numberMethodCondNullishNumberValueExternal = {
    run(): string {
        if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
            return 'then';
        }
        return 'else';
    },
};
