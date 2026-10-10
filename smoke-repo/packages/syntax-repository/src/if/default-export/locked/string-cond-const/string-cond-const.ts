/**
 * Specimen: if-string-default-export-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 28
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const cond: string = 'abc';

const stringCondConst = (): string => {
    if (cond) {
        return 'then';
    }
    return 'else';
};

export default stringCondConst;
