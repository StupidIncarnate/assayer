import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-generator-function-cond-string-length-receiver-external', () => {
    it('VALID: {receiver: external} => if on line 2 never run, undriven from line 2, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/generator-function/if-number-generator-function-cond-string-length-receiver-external/if-number-generator-function-cond-string-length-receiver-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 2, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 2 }],
            darkSpots: [],
            gaps: []
        });
    });
});
