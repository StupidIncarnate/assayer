/**
 * Specimen: if-number-async-function-cond-array-length-boolean-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 26: driven
 * - if else on line 26: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 29
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const receiver: readonly boolean[] = [true, false, true];

export async function numberCondArrayLengthBooleanReceiverConst(): Promise<string> {
    await Promise.resolve();
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
