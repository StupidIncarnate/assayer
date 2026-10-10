/**
 * Specimen: if-boolean-async-function-cond-eq-string-value-param
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
export async function booleanCondEqStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
}
