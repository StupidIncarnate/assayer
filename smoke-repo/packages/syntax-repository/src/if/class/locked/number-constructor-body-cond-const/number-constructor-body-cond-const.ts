/**
 * Specimen: if-number-class-constructor-body-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - none
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
const cond: number = 3;

export class NumberConstructorBodyCondConst {
    public constructor() {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
