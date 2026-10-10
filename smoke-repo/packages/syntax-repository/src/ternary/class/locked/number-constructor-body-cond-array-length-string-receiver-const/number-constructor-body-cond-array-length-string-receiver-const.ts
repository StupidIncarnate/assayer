/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-string-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const receiver: readonly string[] = ['a', 'b', 'c'];

export class NumberConstructorBodyCondArrayLengthStringReceiverConst {
    public constructor() {
        console.log(receiver.length ? 'then' : 'else');
    }
}
