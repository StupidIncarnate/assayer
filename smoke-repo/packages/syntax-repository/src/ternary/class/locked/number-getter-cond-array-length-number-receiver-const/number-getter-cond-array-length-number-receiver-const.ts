/**
 * Specimen: ternary-number-class-getter-cond-array-length-number-receiver-const
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
const receiver: readonly number[] = [10, 20, 30];

export class NumberGetterCondArrayLengthNumberReceiverConst {
    public get result(): string {
        return receiver.length ? 'then' : 'else';
    }
}
