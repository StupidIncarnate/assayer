/**
 * Specimen: if-boolean-async-function-cond-nullish-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 23: both-ways
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
    if (value ?? false) {
        return 'then';
    }
    return 'else';
}
