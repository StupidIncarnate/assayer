/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 26
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
const value: number = 3;

export class BooleanConstructorBodyCondEqNumberValueConst {
    public constructor() {
        if (value === 7) {
            console.log('then');
        }
        console.log('else');
    }
}
