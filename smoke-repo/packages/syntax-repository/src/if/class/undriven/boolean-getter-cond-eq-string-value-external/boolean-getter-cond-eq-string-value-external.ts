/**
 * Specimen: if-boolean-class-getter-cond-eq-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
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
export class BooleanGetterCondEqStringValueExternal {
    public get result(): string {
        if ((process.argv[2] ?? '') === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
