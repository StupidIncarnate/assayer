import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-iife-cond-nullish-number-value-const', () => {
    it('VALID: {value: const} => if on line 4 locked one way, unreachable-exit on line 7, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/iife/locked/if-number-iife-cond-nullish-number-value-const/if-number-iife-cond-nullish-number-value-const.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 4, driven: 'one-way' }],
            caseFailures: [],
            lints: [{ rule: 'unreachable-exit', startLine: 7 }],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
