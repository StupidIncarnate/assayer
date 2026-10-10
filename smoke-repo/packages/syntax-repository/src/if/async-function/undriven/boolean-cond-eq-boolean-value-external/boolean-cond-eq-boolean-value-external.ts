/**
 * Specimen: if-boolean-async-function-cond-eq-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export async function booleanCondEqBooleanValueExternal(): Promise<string> {
    await Promise.resolve();
    if (process.argv[2] === 'yes' === false) {
        return 'then';
    }
    return 'else';
}
