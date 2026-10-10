/**
 * Specimen: if-boolean-class-getter-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 28
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
const cond: boolean = true;

export class BooleanGetterCondConst {
    public get result(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
