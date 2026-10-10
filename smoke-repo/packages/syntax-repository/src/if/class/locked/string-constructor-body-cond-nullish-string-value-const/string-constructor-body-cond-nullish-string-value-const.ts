/**
 * Specimen: if-string-class-constructor-body-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export class StringConstructorBodyCondNullishStringValueConst {
    public constructor() {
        if (value ?? '') {
            console.log('then');
        }
        console.log('else');
    }
}
