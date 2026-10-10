/**
 * Specimen: if-number-class-constructor-body-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 27: never
 * - if else on line 27: never
 * - ternary then on line 27: never
 * - ternary else on line 27: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 27
 * - line 27
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class NumberConstructorBodyCondNullishNumberValueExternal {
    public constructor() {
        if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
            console.log('then');
        }
        console.log('else');
    }
}
