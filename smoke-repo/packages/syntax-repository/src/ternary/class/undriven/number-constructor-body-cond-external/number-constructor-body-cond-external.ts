/**
 * Specimen: ternary-number-class-constructor-body-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class NumberConstructorBodyCondExternal {
    public constructor() {
        console.log(Number(process.argv[2]) ? 'then' : 'else');
    }
}
