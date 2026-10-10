/**
 * Specimen: if-boolean-class-constructor-body-cond-gt-string-value-const
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

export class BooleanConstructorBodyCondGtStringValueConst {
    public constructor() {
        if (value > 'm') {
            console.log('then');
        }
        console.log('else');
    }
}
