/**
 * Specimen: if-number-class-getter-cond-array-length-string-receiver-const
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
const receiver: readonly string[] = ['a', 'b', 'c'];

export class NumberGetterCondArrayLengthStringReceiverConst {
    public get result(): string {
        if (receiver.length) {
            return 'then';
        }
        return 'else';
    }
}
