/**
 * Specimen: ternary-number-class-constructor-body-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: never
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
export class NumberConstructorBodyCondArrayLengthStringReceiverExternal {
    public constructor() {
        console.log(process.argv.slice(2).length ? 'then' : 'else');
    }
}
