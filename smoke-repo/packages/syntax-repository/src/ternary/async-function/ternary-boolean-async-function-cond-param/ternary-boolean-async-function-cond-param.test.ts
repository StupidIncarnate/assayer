import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-boolean-async-function-cond-param', () => {
    it('VALID: {cond: param} => ternary on line 3 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/async-function/ternary-boolean-async-function-cond-param/ternary-boolean-async-function-cond-param.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 3, driven: 'both-ways' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
