/**
 * Specimen: ternary-boolean-async-function-cond-nullish-boolean-value-param
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
export async function booleanCondNullishBooleanValueParam(value: boolean | undefined): Promise<string> {
    await Promise.resolve();
    return value ?? false ? 'then' : 'else';
}
