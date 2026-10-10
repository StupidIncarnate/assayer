/**
 * Specimen: ternary-number-async-function-cond-nullish-number-value-param
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
export async function numberCondNullishNumberValueParam(value: number | undefined): Promise<string> {
    await Promise.resolve();
    return value ?? 0 ? 'then' : 'else';
}
