/**
 * Specimen: ternary-number-default-export-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 25
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

const numberCondStringLengthReceiverConst = (): string => {
    return receiver.length ? 'then' : 'else';
};

export default numberCondStringLengthReceiverConst;
