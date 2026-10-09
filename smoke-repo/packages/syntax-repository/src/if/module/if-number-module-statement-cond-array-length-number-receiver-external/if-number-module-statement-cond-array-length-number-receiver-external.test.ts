import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-module-statement-cond-array-length-number-receiver-external', () => {
    it('VALID: {receiver: external} => if on line 1 locked one way, undriven from line 1, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/module/if-number-module-statement-cond-array-length-number-receiver-external/if-number-module-statement-cond-array-length-number-receiver-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 1, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 1 }],
            darkSpots: [],
            gaps: []
        });
    });
});
