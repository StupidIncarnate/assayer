/**
 * Specimen: ternary-number-object-literal-method-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: driven
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 26
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
const receiver: string = 'abc';

export const numberMethodCondStringLengthReceiverConst = {
    run(): string {
        return receiver.length ? 'then' : 'else';
    },
};
