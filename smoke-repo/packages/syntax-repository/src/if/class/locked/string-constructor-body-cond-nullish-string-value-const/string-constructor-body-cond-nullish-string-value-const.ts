/**
 * Specimen: if-string-class-constructor-body-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export class StringConstructorBodyCondNullishStringValueConst {
    public constructor() {
        if (value ?? '') {
            console.log('then');
        }
        console.log('else');
    }
}
