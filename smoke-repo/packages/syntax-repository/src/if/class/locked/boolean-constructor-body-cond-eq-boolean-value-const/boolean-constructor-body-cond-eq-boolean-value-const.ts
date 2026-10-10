/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-boolean-value-const
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
const value: boolean = true;

export class BooleanConstructorBodyCondEqBooleanValueConst {
    public constructor() {
        if (value === false) {
            console.log('then');
        }
        console.log('else');
    }
}
