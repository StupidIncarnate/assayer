/**
 * Specimen: ternary-boolean-class-constructor-body-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export class BooleanConstructorBodyCondNullishBooleanValueConst {
    public constructor() {
        console.log(value ?? false ? 'then' : 'else');
    }
}
