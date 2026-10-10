/**
 * Specimen: ternary-boolean-class-method-cond-eq-boolean-value-external
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
export class BooleanMethodCondEqBooleanValueExternal {
    public run(): string {
        return process.argv[2] === 'yes' === false ? 'then' : 'else';
    }
}
