/**
 * Specimen: if-number-class-constructor-body-cond-nullish-number-value-const
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
const value: number | undefined = 3;

export class NumberConstructorBodyCondNullishNumberValueConst {
    public constructor() {
        if (value ?? 0) {
            console.log('then');
        }
        console.log('else');
    }
}
