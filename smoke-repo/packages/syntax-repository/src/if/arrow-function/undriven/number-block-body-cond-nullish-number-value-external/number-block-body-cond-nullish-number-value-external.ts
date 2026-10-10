/**
 * Specimen: if-number-arrow-function-block-body-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 24: never
 * - ternary on line 24: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 24
 * - line 24
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberBlockBodyCondNullishNumberValueExternal = (): string => {
    if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
        return 'then';
    }
    return 'else';
};
