/**
 * Specimen: if-boolean-async-function-cond-not-string-value-external
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
export async function booleanCondNotStringValueExternal(): Promise<string> {
    await Promise.resolve();
    if (!(process.argv[2] ?? '')) {
        return 'then';
    }
    return 'else';
}
