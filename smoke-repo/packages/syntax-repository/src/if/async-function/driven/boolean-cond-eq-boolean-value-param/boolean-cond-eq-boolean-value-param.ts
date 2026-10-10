/**
 * Specimen: if-boolean-async-function-cond-eq-boolean-value-param
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
export async function booleanCondEqBooleanValueParam(value: boolean): Promise<string> {
    await Promise.resolve();
    if (value === false) {
        return 'then';
    }
    return 'else';
}
