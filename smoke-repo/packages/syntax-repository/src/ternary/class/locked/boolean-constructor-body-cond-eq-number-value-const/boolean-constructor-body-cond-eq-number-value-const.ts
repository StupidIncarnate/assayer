/**
 * Specimen: ternary-boolean-class-constructor-body-cond-eq-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: never
 * - ternary else on line 26: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 26
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
const value: number = 3;

export class BooleanConstructorBodyCondEqNumberValueConst {
    public constructor() {
        console.log(value === 7 ? 'then' : 'else');
    }
}
