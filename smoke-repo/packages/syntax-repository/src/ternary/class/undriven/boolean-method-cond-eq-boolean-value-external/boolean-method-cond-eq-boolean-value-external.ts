/**
 * Specimen: ternary-boolean-class-method-cond-eq-boolean-value-external
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
export class BooleanMethodCondEqBooleanValueExternal {
    public run(): string {
        return process.argv[2] === 'yes' === false ? 'then' : 'else';
    }
}
