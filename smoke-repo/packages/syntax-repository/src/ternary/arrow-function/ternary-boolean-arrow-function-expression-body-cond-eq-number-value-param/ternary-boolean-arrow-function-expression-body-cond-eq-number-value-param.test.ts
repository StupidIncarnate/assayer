import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-boolean-arrow-function-expression-body-cond-eq-number-value-param', () => {
    it('VALID: {value: param} => ternary on line 1 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/arrow-function/ternary-boolean-arrow-function-expression-body-cond-eq-number-value-param/ternary-boolean-arrow-function-expression-body-cond-eq-number-value-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 1, driven: 'both-ways' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
