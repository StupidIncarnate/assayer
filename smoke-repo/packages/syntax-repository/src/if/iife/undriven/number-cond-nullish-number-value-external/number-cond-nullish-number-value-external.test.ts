import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => if then on line 25 never run; if else on line 25 never run; ternary then on line 25 never run; ternary else on line 25 never run, undriven from line 24, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/iife/undriven/number-cond-nullish-number-value-external/number-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', arm: 'then', line: 25, driven: 'never' }, { kind: 'if', arm: 'else', line: 25, driven: 'never' }, { kind: 'ternary', arm: 'then', line: 25, driven: 'never' }, { kind: 'ternary', arm: 'else', line: 25, driven: 'never' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 24 }],
            darkSpots: [],
            gaps: []
        });
    });
});
