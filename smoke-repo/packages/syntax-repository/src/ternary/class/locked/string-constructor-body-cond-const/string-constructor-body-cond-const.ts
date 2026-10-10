/**
 * Specimen: ternary-string-class-constructor-body-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
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
const cond: string = 'abc';

export class StringConstructorBodyCondConst {
    public constructor() {
        console.log(cond ? 'then' : 'else');
    }
}
