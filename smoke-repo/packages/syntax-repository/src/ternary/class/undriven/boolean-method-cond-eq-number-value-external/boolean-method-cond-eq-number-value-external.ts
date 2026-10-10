/**
 * Specimen: ternary-boolean-class-method-cond-eq-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class BooleanMethodCondEqNumberValueExternal {
    public run(): string {
        return Number(process.argv[2]) === 7 ? 'then' : 'else';
    }
}
