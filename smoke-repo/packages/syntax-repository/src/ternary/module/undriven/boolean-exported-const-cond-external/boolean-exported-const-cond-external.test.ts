import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('boolean-exported-const-cond-external', () => {
    it('VALID: {cond: external} => ternary on line 21 locked one way, undriven from line 21, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/module/undriven/boolean-exported-const-cond-external/boolean-exported-const-cond-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 21, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 21 }],
            darkSpots: [],
            gaps: []
        });
    });
});
