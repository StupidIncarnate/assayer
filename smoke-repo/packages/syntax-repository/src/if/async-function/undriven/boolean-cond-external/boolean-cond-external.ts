/**
 * Specimen: if-boolean-async-function-cond-external
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
export async function booleanCondExternal(): Promise<string> {
    await Promise.resolve();
    if (process.argv[2] === 'yes') {
        return 'then';
    }
    return 'else';
}
