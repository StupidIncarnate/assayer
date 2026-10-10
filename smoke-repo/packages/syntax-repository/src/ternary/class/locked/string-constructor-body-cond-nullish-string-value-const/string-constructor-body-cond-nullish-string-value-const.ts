/**
 * Specimen: ternary-string-class-constructor-body-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export class StringConstructorBodyCondNullishStringValueConst {
    public constructor() {
        console.log(value ?? '' ? 'then' : 'else');
    }
}
