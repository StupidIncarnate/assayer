/**
 * Specimen: if-boolean-class-constructor-body-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export class BooleanConstructorBodyCondNullishBooleanValueConst {
    public constructor() {
        if (value ?? false) {
            console.log('then');
        }
        console.log('else');
    }
}
