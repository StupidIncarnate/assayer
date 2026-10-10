/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-eq-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 22: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 22
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const booleanBlockBodyCondEqStringValueExternal = (): string => {
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
};
