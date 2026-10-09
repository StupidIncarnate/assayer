import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-generator-function-cond-nullish-number-value-external', () => {
    it('VALID: {value: external} => if on line 2 locked one way; ternary on line 2 locked one way, undriven from line 2, every case passes', async () => {
        const observation = await specimenObserveBroker({
            repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
            relPath: 'packages/syntax-repository/src/if/generator-function/undriven/if-number-generator-function-cond-nullish-number-value-external/if-number-generator-function-cond-nullish-number-value-external.ts'
        });
        expect(observation).toStrictEqual({
            branches: [{ kind: 'if', line: 2, driven: 'one-way' }, { kind: 'ternary', line: 2, driven: 'one-way' }],
            caseFailures: [],
            lints: [],
            undriven: [{ startLine: 2 }, { startLine: 2 }],
            darkSpots: [],
            gaps: []
        });
    });
});
