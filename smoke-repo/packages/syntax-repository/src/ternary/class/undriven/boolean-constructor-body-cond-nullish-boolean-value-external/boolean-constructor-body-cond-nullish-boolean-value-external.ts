/**
 * Specimen: ternary-boolean-class-constructor-body-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 27: never
 * - ternary then on line 27: never
 * - ternary else on line 27: never
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
export class BooleanConstructorBodyCondNullishBooleanValueExternal {
    public constructor() {
        console.log((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else');
    }
}
