/**
 * Specimen: if-number-function-expression-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 28
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

export const numberCondStringLengthReceiverConst = function (): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
