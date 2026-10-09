import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('ternary-boolean-iife-cond-nullish-boolean-value-env', () => {
    it('VALID: {value: env} => ternary on line 1 driven both ways; ternary on line 4 driven both ways, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/ternary/iife/ternary-boolean-iife-cond-nullish-boolean-value-env/ternary-boolean-iife-cond-nullish-boolean-value-env.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'ternary', line: 1, driven: 'both-ways' }, { kind: 'ternary', line: 4, driven: 'both-ways' }],
            caseFailures: [],
            lints: [],
            undriven: [],
            darkSpots: [],
            gaps: []
        });
    });
});
