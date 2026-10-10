/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-string-value-const
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
const value: string = 'abc';

export class BooleanConstructorBodyCondEqStringValueConst {
    public constructor() {
        if (value === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
