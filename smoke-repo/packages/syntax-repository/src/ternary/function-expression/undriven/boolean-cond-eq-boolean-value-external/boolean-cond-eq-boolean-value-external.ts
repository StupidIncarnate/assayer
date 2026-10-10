/**
 * Specimen: ternary-boolean-function-expression-cond-eq-boolean-value-external
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
export const booleanCondEqBooleanValueExternal = function (): string {
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
};
