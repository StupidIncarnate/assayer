/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-gt-number-value-external
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
export const booleanExpressionBodyCondGtNumberValueExternal = (): string => Number(process.argv[2]) > 5 ? 'then' : 'else';
