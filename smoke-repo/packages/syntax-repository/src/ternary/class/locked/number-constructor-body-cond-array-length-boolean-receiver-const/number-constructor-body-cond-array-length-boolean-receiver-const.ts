/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-boolean-receiver-const
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
const receiver: readonly boolean[] = [true, false, true];

export class NumberConstructorBodyCondArrayLengthBooleanReceiverConst {
    public constructor() {
        console.log(receiver.length ? 'then' : 'else');
    }
}
