/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-not-boolean-value-external
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
export const booleanBlockBodyCondNotBooleanValueExternal = (): string => {
    return !(process.argv[2] === 'yes') ? 'then' : 'else';
};
