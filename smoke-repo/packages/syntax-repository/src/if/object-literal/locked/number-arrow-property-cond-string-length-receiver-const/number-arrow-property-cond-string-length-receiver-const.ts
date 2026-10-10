/**
 * Specimen: if-number-object-literal-arrow-property-cond-string-length-receiver-const
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
const receiver: string = 'abc';

export const numberArrowPropertyCondStringLengthReceiverConst = {
    runArrow: (): string => {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    },
};
