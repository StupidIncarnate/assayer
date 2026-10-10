/**
 * Specimen: ternary-boolean-async-function-cond-gt-number-value-external
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
export async function booleanCondGtNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    return Number(process.argv[2]) > 5 ? 'then' : 'else';
}
