import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-async-function-cond-array-length-boolean-receiver-external', () => {
    it('VALID: {receiver: external} => if on line 3 never run, undriven from line 1, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/async-function/if-number-async-function-cond-array-length-boolean-receiver-external/if-number-async-function-cond-array-length-boolean-receiver-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 3, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 1 }],
            darkSpots: [],
            gaps: []
        });
    });
});
