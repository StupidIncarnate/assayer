/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 26: never
 * - if else on line 26: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 27
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
const value: string = 'abc';

export class BooleanConstructorBodyCondEqStringValueConst {
    public constructor() {
        if (value === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
