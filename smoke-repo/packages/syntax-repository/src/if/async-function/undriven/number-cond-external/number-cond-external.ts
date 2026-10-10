/**
 * Specimen: if-number-async-function-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: driven
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
export async function numberCondExternal(): Promise<string> {
    await Promise.resolve();
    if (Number(process.argv[2])) {
        return 'then';
    }
    return 'else';
}
