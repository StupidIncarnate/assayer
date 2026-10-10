/**
 * Specimen: ternary-boolean-class-constructor-body-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: driven
 * - ternary else on line 26: never
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
const cond: boolean = true;

export class BooleanConstructorBodyCondConst {
    public constructor() {
        console.log(cond ? 'then' : 'else');
    }
}
