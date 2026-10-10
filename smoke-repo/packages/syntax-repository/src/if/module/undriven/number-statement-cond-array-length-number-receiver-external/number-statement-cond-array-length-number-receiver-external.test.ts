import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-statement-cond-array-length-number-receiver-external', () => {
    it('VALID: {receiver: external} => if on line 21 locked one way, undriven from line 21, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/undriven/number-statement-cond-array-length-number-receiver-external/number-statement-cond-array-length-number-receiver-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 21, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 21 }],
            darkSpots: [],
            gaps: []
        });
    });
});
