/**
 * Specimen: ternary-number-function-declaration-body-cond-nullish-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function numberBodyCondNullishNumberValueParam(value: number | undefined): string {
    return value ?? 0 ? 'then' : 'else';
}
