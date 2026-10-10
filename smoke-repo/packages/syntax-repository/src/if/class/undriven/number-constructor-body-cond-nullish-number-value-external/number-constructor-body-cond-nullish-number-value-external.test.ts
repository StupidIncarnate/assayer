import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('number-constructor-body-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => if on line 25 locked one way; ternary on line 25 locked one way, undriven from line 25, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/class/undriven/number-constructor-body-cond-nullish-number-value-external/number-constructor-body-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 25, driven: 'one-way' }, { kind: 'ternary', line: 25, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 25 }, { startLine: 25 }],
            darkSpots: [],
            gaps: []
        });
    });
});
