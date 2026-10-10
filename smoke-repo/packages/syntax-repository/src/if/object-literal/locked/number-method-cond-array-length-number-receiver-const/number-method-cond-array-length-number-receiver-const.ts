/**
 * Specimen: if-number-object-literal-method-cond-array-length-number-receiver-const
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
const receiver: readonly number[] = [10, 20, 30];

export const numberMethodCondArrayLengthNumberReceiverConst = {
    run(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
