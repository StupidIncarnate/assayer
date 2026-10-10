/**
 * Specimen: if-boolean-class-getter-cond-gt-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 26
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const value: string = 'abc';

export class BooleanGetterCondGtStringValueConst {
    public get result(): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
