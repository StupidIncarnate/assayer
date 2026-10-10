/**
 * Specimen: ternary-boolean-async-function-cond-eq-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
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
export async function booleanCondEqNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    return value === 7 ? 'then' : 'else';
}
