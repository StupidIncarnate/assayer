/**
 * Specimen: ternary-string-arrow-function-expression-body-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 21: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const stringExpressionBodyCondExternal = (): string => process.argv[2] ?? '' ? 'then' : 'else';
