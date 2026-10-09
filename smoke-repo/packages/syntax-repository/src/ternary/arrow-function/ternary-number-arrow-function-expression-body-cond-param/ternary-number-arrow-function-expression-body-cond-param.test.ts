import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-arrow-function-expression-body-cond-param', () => {
    it('VALID: {cond: param} => ternary on line 1 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/arrow-function/ternary-number-arrow-function-expression-body-cond-param/ternary-number-arrow-function-expression-body-cond-param.ts'
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
