/**
 * Specimen: ternary-string-async-function-cond-nullish-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 27: never
 * - ternary then on line 27: never
 * - ternary else on line 27: never
 * - ternary else on line 27: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 27
 * - line 27
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export async function stringCondNullishStringValueExternal(): Promise<string> {
    await Promise.resolve();
    return (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
}
