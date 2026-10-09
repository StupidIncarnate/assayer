import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-class-getter-cond-external', () => {
    it('VALID: {cond: external} => if on line 3 never run, undriven from line 3, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/if-number-class-getter-cond-external/if-number-class-getter-cond-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 3, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 3 }],
            darkSpots: [],
            gaps: []
        });
    });
});
