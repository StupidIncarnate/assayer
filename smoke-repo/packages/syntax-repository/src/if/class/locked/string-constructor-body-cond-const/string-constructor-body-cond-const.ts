/**
 * Specimen: if-string-class-constructor-body-cond-const
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
const cond: string = 'abc';

export class StringConstructorBodyCondConst {
    public constructor() {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
