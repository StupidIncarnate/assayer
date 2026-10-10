/**
 * Specimen: ternary-boolean-async-function-cond-gt-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export async function booleanCondGtNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    return Number(process.argv[2]) > 5 ? 'then' : 'else';
}
