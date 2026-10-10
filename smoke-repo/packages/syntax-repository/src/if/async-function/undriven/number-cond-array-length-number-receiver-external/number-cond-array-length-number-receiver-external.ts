/**
 * Specimen: if-number-async-function-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: never
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
export async function numberCondArrayLengthNumberReceiverExternal(): Promise<string> {
    await Promise.resolve();
    if (process.argv.slice(2).map(Number).length) {
        return 'then';
    }
    return 'else';
}
