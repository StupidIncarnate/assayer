/**
 * Specimen: if-boolean-class-constructor-body-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 26: driven
 * - if else on line 26: never
 *
 * Expected lint errors:
 * - none
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
const value: boolean | undefined = true;

export class BooleanConstructorBodyCondNullishBooleanValueConst {
    public constructor() {
        if (value ?? false) {
            console.log('then');
        }
        console.log('else');
    }
}
