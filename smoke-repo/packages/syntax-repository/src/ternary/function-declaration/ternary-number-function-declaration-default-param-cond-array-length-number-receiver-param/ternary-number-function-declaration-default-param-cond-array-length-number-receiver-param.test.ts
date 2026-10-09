import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-number-function-declaration-default-param-cond-array-length-number-receiver-param', () => {
    it('VALID: {receiver: param} => ternary on line 1 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/function-declaration/ternary-number-function-declaration-default-param-cond-array-length-number-receiver-param/ternary-number-function-declaration-default-param-cond-array-length-number-receiver-param.ts'
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
