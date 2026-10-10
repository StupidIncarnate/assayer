/**
 * Specimen: ternary-boolean-class-getter-cond-not-number-value-external
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
export class BooleanGetterCondNotNumberValueExternal {
    public get result(): string {
        return !Number(process.argv[2]) ? 'then' : 'else';
    }
}
