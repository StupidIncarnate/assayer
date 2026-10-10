/**
 * Specimen: ternary-boolean-async-function-cond-gt-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: never
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
export async function booleanCondGtStringValueExternal(): Promise<string> {
    await Promise.resolve();
    return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
}
